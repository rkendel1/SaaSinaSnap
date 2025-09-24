'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin'; // Import supabaseAdminClient
import { stripeAdmin } from '@/libs/stripe/stripe-admin'; // Import stripeAdmin

import { createCreatorProduct, deleteCreatorProduct,updateCreatorProduct } from '../controllers/creator-products';
import { getCreatorProfile } from '../controllers/creator-profile';
import { createStripePrice,createStripeProduct } from '../controllers/stripe-connect';
import type { CreatorProductInsert, CreatorProductUpdate, ProductFormItem } from '../types';

export async function createCreatorProductAction(productData: Omit<CreatorProductInsert, 'creator_id'>) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getCreatorProfile(user.id); // Use user.id directly
  if (!creatorProfile) {
    throw new Error('Creator profile not found');
  }

  return createCreatorProduct({
    ...productData,
    creator_id: user.id, // Use user.id directly
  });
}

export async function updateCreatorProductAction(productId: string, updates: CreatorProductUpdate) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProduct(productId, updates);
}

export async function deleteCreatorProductAction(productId: string) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return deleteCreatorProduct(productId);
}

export async function fetchStripeProductsForCreatorAction(): Promise<ProductFormItem[]> {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getCreatorProfile(user.id); // Use user.id directly
  if (!creatorProfile?.stripe_access_token) {
    return []; // No Stripe account connected
  }

  const stripeProducts: ProductFormItem[] = [];

  try {
    // Fetch products from Stripe
    const products = await stripeAdmin.products.list({
      limit: 100, // Adjust limit as needed
      active: true,
    }, {
      stripeAccount: creatorProfile.stripe_access_token,
    });

    for (const product of products.data) {
      // Fetch prices for each product
      const prices = await stripeAdmin.prices.list({
        product: product.id,
        active: true,
      }, {
        stripeAccount: creatorProfile.stripe_access_token,
      });

      // For simplicity, we'll take the first active price.
      // In a real app, you might handle multiple prices per product.
      const price = prices.data[0];

      if (price) {
        // Check if this Stripe product is already linked in our database
        const { data: existingCreatorProduct } = await supabaseAdminClient
          .from('creator_products')
          .select('id, name, description, price, currency, product_type, active')
          .eq('creator_id', user.id) // Use user.id directly
          .eq('stripe_product_id', product.id)
          .eq('stripe_price_id', price.id)
          .single();

        stripeProducts.push({
          id: existingCreatorProduct?.id || undefined,
          stripeProductId: product.id,
          stripePriceId: price.id,
          name: product.name,
          description: product.description || undefined,
          price: (price.unit_amount || 0) / 100, // Convert cents to dollars
          currency: price.currency,
          type: price.type === 'recurring' ? 'subscription' : 'one_time', // Simplify type mapping
          active: existingCreatorProduct?.active || false, // Default to false if not linked
          isExistingStripeProduct: true,
          isLinkedToOurDb: !!existingCreatorProduct,
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch Stripe products for creator:', error);
  }

  return stripeProducts;
}


export async function importProductsFromStripeAction(productsToManage: ProductFormItem[]) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorProfile = await getCreatorProfile(user.id); // Use user.id directly
  if (!creatorProfile?.stripe_access_token) {
    throw new Error('Stripe Connect account not found or not fully connected');
  }

  const processedProducts = [];

  for (const product of productsToManage) {
    try {
      let currentStripeProductId = product.stripeProductId;
      let currentStripePriceId = product.stripePriceId;

      // If it's a new product (not from existing Stripe list), create in Stripe
      if (!product.isExistingStripeProduct) {
        currentStripeProductId = await createStripeProduct(creatorProfile.stripe_access_token, {
          name: product.name,
          description: product.description,
          metadata: {
            created_by: user.id, // Use user.id directly
          },
        });

        const priceData: {
          product: string;
          unit_amount: number;
          currency: string;
          recurring?: {
            interval: 'day' | 'week' | 'month' | 'year';
            interval_count?: number;
          };
        } = {
          product: currentStripeProductId,
          unit_amount: Math.round(product.price * 100),
          currency: product.currency,
        };

        if (product.type === 'subscription') {
          priceData.recurring = {
            interval: 'month' as const,
          };
        }
        currentStripePriceId = await createStripePrice(creatorProfile.stripe_access_token, priceData);
      }

      // Now, create or update the creator_products entry in our database
      const creatorProductData: CreatorProductInsert = {
        creator_id: user.id, // Use user.id directly
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        product_type: product.type,
        stripe_product_id: currentStripeProductId,
        stripe_price_id: currentStripePriceId,
        active: product.active,
      };

      if (product.id) {
        // Update existing creator product
        const updatedProduct = await updateCreatorProduct(product.id, creatorProductData);
        processedProducts.push(updatedProduct);
      } else {
        // Create new creator product
        const newProduct = await createCreatorProduct(creatorProductData);
        processedProducts.push(newProduct);
      }
    } catch (error) {
      console.error(`Failed to process product ${product.name}:`, error);
      // Depending on desired behavior, you might want to re-throw or collect errors
    }
  }

  return processedProducts;
}