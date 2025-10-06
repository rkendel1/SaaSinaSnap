'use server';

import Stripe from 'stripe';

import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import type { SubscriptionCheckoutSession } from '../types';

export async function createCheckoutSession(
  tierId: string,
  userId: string
): Promise<SubscriptionCheckoutSession> {
  const supabase = await createSupabaseServerClient();

  // Get the pricing tier
  const { data: tier } = await supabase
    .from('platform_pricing_tiers')
    .select('*')
    .eq('id', tierId)
    .single();

  if (!tier) {
    throw new Error('Selected pricing tier not found');
  }

  // Get or create Stripe Customer for the creator
  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  let customerId = creator?.stripe_customer_id || null;

  if (customerId === null) {
    // Get user details for the customer
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (!user.user) {
      throw new Error('User not found');
    }

    // Create a customer in Stripe
    const customer = await stripeAdmin.customers.create({
      email: user.user.email,
      metadata: {
        userId: userId,
      },
    });
    customerId = customer.id;

    // Save the customer ID
    await supabase
      .from('creator_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // Create the checkout session
  if (!tier.stripe_price_id) {
    throw new Error('Pricing tier has no Stripe price ID');
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId || undefined,
    payment_method_types: ['card'],
    line_items: [
      {
        price: tier.stripe_price_id as string,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/creator/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?canceled=true`,
    metadata: {
      userId,
      tierId,
    },
    subscription_data: {
      metadata: {
        userId,
        tierId,
      },
    },
  };

  const session = await stripeAdmin.checkout.sessions.create(sessionParams);

  // Create a record of the checkout session
  const checkoutData = {
    id: session.id,
    creator_id: userId,
    tier_id: tierId,
    status: session.status || 'open',
    url: session.url || '',
    expires_at: new Date(session.expires_at! * 1000).toISOString(),
    metadata: {},
  };

  const { error } = await supabase
    .from('creator_platform_checkout_sessions')
    .insert(checkoutData);

  if (error) {
    console.error('Failed to create checkout session record:', error);
    throw new Error('Failed to create checkout session record');
  }

  return {
    id: session.id,
    url: session.url!,
    status: session.status as 'open' | 'complete' | 'expired',
    expires_at: new Date(session.expires_at! * 1000).toISOString(),
  };
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  customerId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Get the creator profile by customer ID
  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!creator) {
    throw new Error('Creator not found for customer');
  }

  // Update the subscription record
  await supabase.from('creator_platform_subscriptions').upsert({
    id: subscription.id,
    creator_id: creator.id,
    tier_id: subscription.metadata.tierId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    metadata: subscription.metadata,
  });

  // Update the creator profile subscription status
  await supabase
    .from('creator_profiles')
    .update({
      platform_subscription_id: subscription.id,
      platform_subscription_status: subscription.status,
      platform_subscription_tier: subscription.metadata.tierId,
      platform_subscription_started_at: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      platform_subscription_ends_at: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', creator.id);
}