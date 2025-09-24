'use server';

import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

interface CreateCreatorCheckoutParams {
  creatorId: string;
  productId: string;
  stripePriceId: string;
}

export async function createCreatorCheckoutAction(params: CreateCreatorCheckoutParams) {
  const { creatorId, productId, stripePriceId } = params;
  
  // 1. Get the user from session
  const session = await getSession();

  if (!session?.user) {
    return redirect(`${getURL()}/signup`);
  }

  if (!session.user.email) {
    throw Error('Could not get email');
  }

  // 2. Get creator and product details
  const supabase = await createSupabaseServerClient();
  
  const [creatorResult, productResult] = await Promise.all([
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

  if (creatorResult.error || !creatorResult.data) {
    throw Error('Creator not found');
  }

  if (productResult.error || !productResult.data) {
    throw Error('Product not found');
  }

  const creator = creatorResult.data;
  const product = productResult.data;

  // 3. Retrieve or create the customer in Stripe
  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });

  // 4. Create a checkout session in Stripe with creator branding
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
    success_url: `${getURL()}/c/${creator.custom_domain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getURL()}/c/${creator.custom_domain}/pricing`,
    metadata: {
      creator_id: creatorId,
      product_id: productId,
      user_id: session.user.id,
    },
    // Add creator branding if available
    ...(creator.business_name && {
      custom_text: {
        submit: {
          message: `Complete your purchase from ${creator.business_name}`,
        },
      },
    }),
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 5. Redirect to checkout url
  redirect(checkoutSession.url);
}