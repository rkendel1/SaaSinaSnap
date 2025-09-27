'use server';

import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getProducts } from '@/features/pricing/controllers/get-products';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { ProductPriceManagementService } from '@/features/pricing/services/product-price-management';
import { PricingChangeService } from '@/features/pricing/services/pricing-change-service';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';

interface ProductData {
  id?: string;
  name: string;
  description: string;
  image?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  active: boolean;
}

export async function createPlatformProductAction(productData: ProductData) {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) throw new Error('Not authenticated');

  // 1. Create Product in Stripe
  const stripeProduct = await stripeAdmin.products.create({
    name: productData.name,
    description: productData.description,
    images: productData.image ? [productData.image] : [],
    active: true,
  });

  // 2. Create Prices in Stripe
  const [monthlyStripePrice, yearlyStripePrice] = await Promise.all([
    stripeAdmin.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(productData.monthlyPrice * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
    }),
    stripeAdmin.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(productData.yearlyPrice * 100),
      currency: 'usd',
      recurring: { interval: 'year' },
    }),
  ]);

  // 3. Sync with Supabase immediately to avoid race conditions with webhooks
  await upsertProduct(stripeProduct);
  await Promise.all([upsertPrice(monthlyStripePrice), upsertPrice(yearlyStripePrice)]);

  revalidatePath('/dashboard/products');
  revalidatePath('/');
  revalidatePath('/pricing');
  return getProducts({ includeInactive: true });
}

export async function updatePlatformProductAction(productData: ProductData) {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
  if (!user?.id) throw new Error('Not authenticated');

  if (!productData.id) {
    throw new Error('Product ID is required for updates.');
  }

  // 1. Analyze price change impact before making changes
  const currentProduct = await stripeAdmin.products.retrieve(productData.id);
  const existingPrices = await stripeAdmin.prices.list({ product: productData.id, active: true });
  
  const currentMonthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month')?.unit_amount || 0;
  const currentYearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year')?.unit_amount || 0;
  const newMonthlyAmount = Math.round(productData.monthlyPrice * 100);
  const newYearlyAmount = Math.round(productData.yearlyPrice * 100);

  // Check if this is a significant price change
  const monthlyChangePercentage = currentMonthlyPrice > 0 ? Math.abs(newMonthlyAmount - currentMonthlyPrice) / currentMonthlyPrice : 0;
  const yearlyChangePercentage = currentYearlyPrice > 0 ? Math.abs(newYearlyAmount - currentYearlyPrice) / currentYearlyPrice : 0;

  if (monthlyChangePercentage > 0.1 || yearlyChangePercentage > 0.1) {
    // Analyze impact for significant price changes (>10%)
    const impactAnalysis = await ProductPriceManagementService.analyzePriceChangeImpact(
      productData.id,
      currentMonthlyPrice / 100,
      productData.monthlyPrice
    );

    console.log('Price change impact analysis:', impactAnalysis);

    // Create pricing change notification if there are existing subscribers
    if (impactAnalysis.existing_subscribers > 0) {
      await PricingChangeService.createPricingChangeNotification(
        user.id,
        productData.id,
        {
          change_type: newMonthlyAmount > currentMonthlyPrice ? 'price_increase' : 'price_decrease',
          old_data: {
            price: currentMonthlyPrice / 100,
          },
          new_data: {
            price: productData.monthlyPrice,
          },
          effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          reason: 'Platform pricing adjustment',
        }
      );
    }
  }

  // 2. Update Product in Stripe
  const stripeProduct = await stripeAdmin.products.update(productData.id, {
    name: productData.name,
    description: productData.description,
    images: productData.image ? [productData.image] : [],
    active: productData.active,
  });

  // 3. Handle Price Updates by creating new prices and archiving old ones
  const pricesToUpsert: Stripe.Price[] = [];

  if (!existingPrices.data.find(p => p.recurring?.interval === 'month') || existingPrices.data.find(p => p.recurring?.interval === 'month')?.unit_amount !== newMonthlyAmount) {
    const existingMonthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month');
    if (existingMonthlyPrice) {
      // Create audit record for price change
      await ProductPriceManagementService.createPriceChangeAudit(
        productData.id,
        existingMonthlyPrice.id,
        'new_monthly_price', // Will be updated after creation
        'Platform pricing update',
        await ProductPriceManagementService.analyzePriceChangeImpact(productData.id, currentMonthlyPrice / 100, productData.monthlyPrice)
      );
      
      pricesToUpsert.push(await stripeAdmin.prices.update(existingMonthlyPrice.id, { active: false }));
    }
    pricesToUpsert.push(await stripeAdmin.prices.create({
      product: productData.id,
      unit_amount: newMonthlyAmount,
      currency: 'usd',
      recurring: { interval: 'month' },
      active: productData.active,
    }));
  }

  if (!existingPrices.data.find(p => p.recurring?.interval === 'year') || existingPrices.data.find(p => p.recurring?.interval === 'year')?.unit_amount !== newYearlyAmount) {
    const existingYearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year');
    if (existingYearlyPrice) {
      // Create audit record for price change
      await ProductPriceManagementService.createPriceChangeAudit(
        productData.id,
        existingYearlyPrice.id,
        'new_yearly_price', // Will be updated after creation
        'Platform pricing update',
        await ProductPriceManagementService.analyzePriceChangeImpact(productData.id, currentYearlyPrice / 100, productData.yearlyPrice)
      );
      
      pricesToUpsert.push(await stripeAdmin.prices.update(existingYearlyPrice.id, { active: false }));
    }
    pricesToUpsert.push(await stripeAdmin.prices.create({
      product: productData.id,
      unit_amount: newYearlyAmount,
      currency: 'usd',
      recurring: { interval: 'year' },
      active: productData.active,
    }));
  }

  // If product is being archived, archive all its active prices
  if (productData.active === false) {
    for (const price of existingPrices.data) {
      if (price.active) {
        pricesToUpsert.push(await stripeAdmin.prices.update(price.id, { active: false }));
      }
    }
  }

  // 4. Sync all changes with Supabase
  await upsertProduct(stripeProduct);
  if (pricesToUpsert.length > 0) {
    await Promise.all(pricesToUpsert.map(p => upsertPrice(p)));
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/');
  revalidatePath('/pricing');
  return getProducts({ includeInactive: true });
}