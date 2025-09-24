'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { createStripePrice, createStripeProduct } from '@/features/creator-onboarding/controllers/stripe-connect';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

interface ProductData {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  active: boolean;
  product_type: 'one_time' | 'subscription';
}

export async function createOrUpdateCreatorProductAction(productData: ProductData) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_access_token) {
    throw new Error('Stripe account not connected');
  }

  const { id, name, description, price, image_url, active, product_type } = productData;

  if (id) {
    // Update existing product
    const { data: updatedProduct, error } = await supabaseAdminClient
      .from('creator_products')
      .update({ name, description, price, image_url, active, product_type })
      .eq('id', id)
      .select('stripe_product_id')
      .single();

    if (error) throw error;

    if (updatedProduct?.stripe_product_id) {
      await stripeAdmin.products.update(
        updatedProduct.stripe_product_id,
        { name, description, images: image_url ? [image_url] : [], active },
        { stripeAccount: creatorProfile.stripe_access_token }
      );
    }
  } else {
    // Create new product
    const stripeProductId = await createStripeProduct(creatorProfile.stripe_access_token, {
      name,
      description,
      metadata: { creator_id: user.id },
    });

    const priceData: any = {
      product: stripeProductId,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    };

    if (product_type === 'subscription') {
      priceData.recurring = { interval: 'month' };
    }

    const stripePriceId = await createStripePrice(creatorProfile.stripe_access_token, priceData);

    const { error } = await supabaseAdminClient.from('creator_products').insert({
      creator_id: user.id,
      name,
      description,
      price,
      image_url,
      active,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      currency: 'usd',
      product_type,
    });

    if (error) throw error;
  }

  revalidatePath('/creator/dashboard/products');
}

export async function archiveCreatorProductAction(productId: string) {
  const user = await getAuthenticatedUser();
  if (!user?.id) throw new Error('Not authenticated');

  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile?.stripe_access_token) throw new Error('Stripe account not connected');

  const { data: productToArchive, error } = await supabaseAdminClient
    .from('creator_products')
    .update({ active: false })
    .eq('id', productId)
    .select('stripe_product_id')
    .single();

  if (error) throw error;

  if (productToArchive?.stripe_product_id) {
    await stripeAdmin.products.update(
      productToArchive.stripe_product_id,
      { active: false },
      { stripeAccount: creatorProfile.stripe_access_token }
    );
  }

  revalidatePath('/creator/dashboard/products');
}