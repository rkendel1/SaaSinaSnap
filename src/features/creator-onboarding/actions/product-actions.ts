'use server';

import { getSession } from '@/features/account/controllers/get-session';

import { createCreatorProduct, deleteCreatorProduct,updateCreatorProduct } from '../controllers/creator-products';
import { getCreatorProfile } from '../controllers/creator-profile';
import { createStripePrice,createStripeProduct } from '../controllers/stripe-connect';
import type { CreatorProductInsert, CreatorProductUpdate, ProductImportItem } from '../types';

export async function createCreatorProductAction(productData: Omit<CreatorProductInsert, 'creator_id'>) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);
  if (!creatorProfile) {
    throw new Error('Creator profile not found');
  }

  return createCreatorProduct({
    ...productData,
    creator_id: session.user.id,
  });
}

export async function updateCreatorProductAction(productId: string, updates: CreatorProductUpdate) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProduct(productId, updates);
}

export async function deleteCreatorProductAction(productId: string) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return deleteCreatorProduct(productId);
}

export async function importProductsFromStripeAction(products: ProductImportItem[]) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);
  if (!creatorProfile?.stripe_account_id) {
    throw new Error('Stripe Connect account not found');
  }

  const createdProducts = [];

  for (const product of products) {
    try {
      let stripeProductId = product.stripeProductId;
      let stripePriceId = product.stripePriceId;

      // Create Stripe product if not provided
      if (!stripeProductId) {
        stripeProductId = await createStripeProduct(creatorProfile.stripe_account_id, {
          name: product.name,
          description: product.description,
          metadata: {
            created_by: session.user.id,
          },
        });
      }

      // Create Stripe price if not provided
      if (!stripePriceId && stripeProductId) {
        const priceData: {
          product: string;
          unit_amount: number;
          currency: string;
          recurring?: {
            interval: 'day' | 'week' | 'month' | 'year';
            interval_count?: number;
          };
        } = {
          product: stripeProductId,
          unit_amount: Math.round(product.price * 100), // Convert to cents
          currency: product.currency,
        };

        if (product.type === 'subscription') {
          priceData.recurring = {
            interval: 'month' as const,
          };
        }

        stripePriceId = await createStripePrice(creatorProfile.stripe_account_id, priceData);
      }

      // Create creator product in our database
      const creatorProduct = await createCreatorProduct({
        creator_id: session.user.id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        product_type: product.type,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        active: true,
      });

      createdProducts.push(creatorProduct);
    } catch (error) {
      console.error(`Failed to import product ${product.name}:`, error);
    }
  }

  return createdProducts;
}