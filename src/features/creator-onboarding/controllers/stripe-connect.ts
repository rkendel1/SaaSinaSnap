'use server';

import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';
import Stripe from 'stripe';

import type { StripeConnectAccount } from '../types';

export async function createStripeConnectAccount(email: string): Promise<{ accountId: string; onboardingUrl: string }> {
  // Create Stripe Express account
  const account = await stripeAdmin.accounts.create({
    type: 'express',
    email: email,
  });

  // Create account link for onboarding
  const accountLink = await stripeAdmin.accountLinks.create({
    account: account.id,
    refresh_url: `${getURL()}/creator/onboarding/stripe-connect?refresh=true`,
    return_url: `${getURL()}/creator/onboarding/stripe-connect?success=true`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}

export async function getStripeConnectAccount(accountId: string): Promise<StripeConnectAccount> {
  const account = await stripeAdmin.accounts.retrieve(accountId);
  
  return {
    id: account.id,
    type: account.type || 'express',
    business_profile: account.business_profile as StripeConnectAccount['business_profile'] || undefined,
    capabilities: account.capabilities || {},
    charges_enabled: account.charges_enabled || false,
    payouts_enabled: account.payouts_enabled || false,
    details_submitted: account.details_submitted || false,
  };
}

export async function createStripeConnectLoginLink(accountId: string): Promise<{ url: string }> {
  const loginLink = await stripeAdmin.accounts.createLoginLink(accountId);
  return { url: loginLink.url };
}

export async function createStripeProduct(accountId: string, productData: {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const product = await stripeAdmin.products.create({
    ...productData,
  }, {
    stripeAccount: accountId,
  });

  return product.id;
}

export async function createStripePrice(accountId: string, priceData: {
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
  };
}): Promise<string> {
  const price = await stripeAdmin.prices.create({
    ...priceData,
  }, {
    stripeAccount: accountId,
  });

  return price.id;
}

export async function createPaymentIntent(
  accountId: string,
  amount: number,
  currency: string,
  metadata?: Record<string, string>
): Promise<{ client_secret: string; payment_intent_id: string }> {
  const applicationFeeAmount = Math.round(amount * 0.05); // 5% platform fee

  const paymentIntent = await stripeAdmin.paymentIntents.create({
    amount,
    currency,
    metadata,
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: accountId,
    },
  });

  return {
    client_secret: paymentIntent.client_secret!,
    payment_intent_id: paymentIntent.id,
  };
}