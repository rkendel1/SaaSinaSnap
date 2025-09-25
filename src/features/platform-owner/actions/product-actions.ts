'use server';

import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getProducts } from '@/features/pricing/controllers/get-products';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
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

  // 1. Update Product in Stripe
  const stripeProduct = await stripeAdmin.products.update(productData.id, {
    name: productData.name,
    description: productData.description,
    images: productData.image ? [productData.image] : [],
    active: productData.active,
  });

  // 2. Handle Price Updates by creating new prices and archiving old ones
  const existingPrices = await stripeAdmin.prices.list({ product: productData.id, active: true });
  const pricesToUpsert: Stripe.Price[] = [];

  const newMonthlyAmount = Math.round(productData.monthlyPrice * 100);
  const existingMonthlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'month');
  if (!existingMonthlyPrice || existingMonthlyPrice.unit_amount !== newMonthlyAmount) {
    if (existingMonthlyPrice) {
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

  const newYearlyAmount = Math.round(productData.yearlyPrice * 100);
  const existingYearlyPrice = existingPrices.data.find(p => p.recurring?.interval === 'year');
  if (!existingYearlyPrice || existingYearlyPrice.unit_amount !== newYearlyAmount) {
    if (existingYearlyPrice) {
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

  // 3. Sync all changes with Supabase
  await upsertProduct(stripeProduct);
  if (pricesToUpsert.length > 0) {
    await Promise.all(pricesToUpsert.map(p => upsertPrice(p)));
  }

  revalidatePath('/dashboard/products');
  revalidatePath('/');
  revalidatePath('/pricing');
  return getProducts({ includeInactive: true });
}