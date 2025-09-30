'use server';

import { headers } from 'next/headers';
import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';
import { AddressParam } from '@stripe/stripe-js';

// Temporary type definition for subscriptions until types are regenerated
interface SubscriptionInsert {
  id: string;
  user_id: string;
  metadata: any;
  status: string;
  price_id: string;
  cancel_at_period_end: boolean;
  cancel_at?: string | null;
  canceled_at?: string | null;
  current_period_start: string;
  current_period_end: string;
  created: string;
  ended_at?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  quantity?: number | null;
}

export async function upsertUserSubscription({
  subscriptionId,
  customerId,
  isCreateAction,
}: {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}) {
  

  // Upsert the latest status of the subscription object.
  const subscriptionData: SubscriptionInsert = {
    id: subscription.id,
    user_id: userId,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
    current_period_start: toDateTime(subscription.current_period_start).toISOString(),
    current_period_end: toDateTime(subscription.current_period_end).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
    quantity: subscription.items.data[0].quantity,
  };

  const { error } = await supabaseAdmin.from('subscriptions').upsert([subscriptionData]);
  if (error) {
    throw error;
  }
  console.info(`Inserted/updated subscription [${subscription.id}] for user [${userId}]`);

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (isCreateAction && subscription.default_payment_method && userId) {
    await copyBillingDetailsToCustomer(userId, subscription.default_payment_method as Stripe.PaymentMethod);
  }
}

const copyBillingDetailsToCustomer = async (userId: string, paymentMethod: Stripe.PaymentMethod) => {
  const customer = paymentMethod.customer;
  if (typeof customer !== 'string') {
    throw new Error('Customer id not found');
  }

  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;

  await stripeAdmin.customers.update(customer, { name, phone, address: address as AddressParam });
};