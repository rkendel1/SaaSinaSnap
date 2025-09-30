import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { CreatorProduct } from '@/features/creator-onboarding/types'; // Import CreatorProduct type
import { posthogServer } from '@/libs/posthog/posthog-server-client'; // Import posthogServer
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { creatorId, productId, stripePriceId } = await request.json();

    if (!creatorId || !productId || !stripePriceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: creatorId, productId, stripePriceId' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch creator profile to get Stripe access token
    const creator = await getCreatorProfile(creatorId);
    
    // Check for Stripe access token - use test environment token
    const stripeAccessToken = creator?.stripe_test_access_token;
    
    if (!creator || !stripeAccessToken) {
      return NextResponse.json(
        { error: 'Creator not found or Stripe account not connected' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch product details to determine mode (subscription/payment)
    const supabase = await createSupabaseServerClient();
    const { data: product, error: productError } = await supabase
      .from('creator_products')
      .select('product_type, name') // Select name for PostHog
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // For embedded checkout, we don't have an authenticated user on our platform.
    // We'll create a customer in Stripe if one doesn't exist, but we can't link it to a PayLift user directly
    // until they complete the checkout and potentially sign up.
    // For now, we'll create a guest checkout.
    // If we wanted to support logged-in users, the embed script would need to pass a user token.

    // Create a checkout session in Stripe with creator branding
    const checkoutSession = await stripeAdmin.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: (product as CreatorProduct).product_type === 'subscription' ? 'subscription' : 'payment',
      allow_promotion_codes: true,
      success_url: `${getURL()}/c/${creatorId}/success?session_id={CHECKOUT_SESSION_ID}`, // Use creatorId
      cancel_url: `${getURL()}/c/${creatorId}/pricing`, // Use creatorId
      metadata: {
        creator_id: creatorId,
        product_id: productId,
        // user_id: user.id, // No user.id available for guest embeds
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
      stripeAccount: stripeAccessToken, // Use the creator's access token (test or legacy)
    });

    if (!checkoutSession || !checkoutSession.url) {
      throw new Error('Failed to create Stripe Checkout Session');
    }

    // PostHog: Capture embed checkout initiated event
    posthogServer.capture({
      distinctId: creatorId, // Use creatorId as distinct ID for creator-side analytics
      event: 'embed_checkout_initiated',
      properties: {
        creator_id: creatorId,
        product_id: productId,
        product_name: (product as Pick<CreatorProduct, 'name'>).name, // Explicitly type product for name access
        embed_type: 'checkout_button', // Assuming this is triggered by a checkout button embed
        session_id: checkoutSession.id,
        mode: (product as CreatorProduct).product_type === 'subscription' ? 'subscription' : 'payment',
        current_url: request.headers.get('referer') || 'unknown', // Capture the referring URL
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating embed checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}