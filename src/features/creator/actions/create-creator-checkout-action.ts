'use server';

import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import { Price } from '@/features/pricing/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface CreateCreatorCheckoutParams {
  creatorId: string;
  productId: string;
  stripePriceId: string;
}

export async function createCreatorCheckoutAction(params: CreateCreatorCheckoutParams) {
  const { creatorId, productId, stripePriceId } = params;
  
  // 1. Get the user from session
  const user = await getAuthenticatedUser();

  if (!user) {
    return redirect(`${getURL()}/signup`);
  }

  if (!user.email) {
    throw Error('Could not get email');
  }

  // 2. Get creator and product details
  const supabase = await createSupabaseServerClient();
  
  const [creatorResponse, productResponse] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', creatorId)
      .single(),
    supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .single()
  ]);

  const creatorResult = creatorResponse as PostgrestSingleResponse<CreatorProfile>;
  const productResult = productResponse as PostgrestSingleResponse<CreatorProduct>;

  if (creatorResult.error || !creatorResult.data) {
    throw Error('Creator not found');
  }

  if (productResult.error || !productResult.data) {
    throw Error('Product not found');
  }

  const creator = creatorResult.data;
  const product = productResult.data;

  // Ensure creator has a Stripe account connected and access token
  if (!creator.stripe_access_token) {
    throw new Error('Creator Stripe account not connected or access token missing.');
  }

  // 3. Retrieve or create the customer in Stripe (using platform's Stripe client)
  const customer = await getOrCreateCustomer({
    userId: user.id,
    email: user.email,
  });

  // 4. Create a checkout session in Stripe with creator branding
  // This checkout session is created by the platform on behalf of the connected account
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    mode: product.product_type === 'subscription' ? 'subscription' : 'payment',
    allow_promotion_codes: true,
    success_url: `${getURL()}/c/${creator.page_slug}/success?session_id={CHECKOUT_SESSION_ID}`, // Use creator.page_slug
    cancel_url: `${getURL()}/c/${creator.page_slug}/pricing`, // Use creator.page_slug
    metadata: {
      creator_id: creatorId,
      product_id: productId,
      user_id: user.id,
    },
    // Add creator branding if available
    ...(creator.business_name && {
      custom_text: {
        submit: {
          message: `Complete your purchase from ${creator.business_name}`,
        },
      },
    }),
  }, {
    stripeAccount: creator.stripe_access_token,
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 5. Redirect to checkout url
  redirect(checkoutSession.url);
}