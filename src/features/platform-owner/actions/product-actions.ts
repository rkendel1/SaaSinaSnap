'use server';

import { revalidatePath } from 'next/cache';

import { getProducts } from '@/features/pricing/controllers/get-products';
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
  // 1. Create Product in Stripe
  const stripeProduct = await stripeAdmin.products.create({
    name: productData.name,
    description: productData.description,
    images: productData.image ? [productData.image] : [],
    active: true,
  });

  // 2. Create Prices in Stripe
  await Promise.all([
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

  // 3. Sync with Supabase (webhooks will handle this, but we can force it for immediate UI update)
  await upsertProduct(stripeProduct);
  // Note: Prices will be upserted via webhooks.

  revalidatePath('/creator/dashboard/platform-products');
  return getProducts({ includeInactive: true });
}

export async function updatePlatformProductAction(productData: ProductData) {
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

  // 2. Update Prices in Stripe (Stripe doesn't allow price updates, so we archive old and create new if needed)
  // For simplicity here, we assume prices don't change. A full implementation would handle price changes.
  // If archiving, we deactivate associated prices.
  if (productData.active === false) {
    const prices = await stripeAdmin.prices.list({ product: productData.id });
    await Promise.all(prices.data.map(price => stripeAdmin.prices.update(price.id, { active: false })));
  }

  // 3. Sync with Supabase
  await upsertProduct(stripeProduct);

  revalidatePath('/creator/dashboard/platform-products');
  return getProducts({ includeInactive: true });
}