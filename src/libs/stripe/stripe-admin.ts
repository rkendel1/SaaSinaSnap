import Stripe from 'stripe';

import { getEnvVar } from '@/utils/get-env-var';

// Default Stripe client for platform operations
export const stripeAdmin = new Stripe(getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2023-10-16',
  // Register this as an official Stripe plugin.
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: 'Staryer Platform',
    version: '0.1.0',
  },
});

/**
 * Create a Stripe client for a specific environment
 * @param environment - 'test' or 'production'
 * @param stripeAccountId - Optional connected account ID
 * @param accessToken - Optional access token for connected account
 */
export function createStripeClient(
  environment: 'test' | 'production' = 'test',
  stripeAccountId?: string,
  accessToken?: string
): Stripe {
  let secretKey: string;
  
  if (accessToken) {
    // Use the provided access token (for connected accounts)
    secretKey = accessToken;
  } else {
    // Use platform credentials based on environment
    secretKey = getEnvVar(
      environment === 'test' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_PRODUCTION_SECRET_KEY || process.env.STRIPE_SECRET_KEY,
      'STRIPE_SECRET_KEY'
    );
  }

  const stripeOptions: Stripe.StripeConfig = {
    apiVersion: '2023-10-16',
    appInfo: {
      name: 'Staryer Platform',
      version: '0.1.0',
    },
  };

  // Add stripe account for connected account operations
  if (stripeAccountId) {
    stripeOptions.stripeAccount = stripeAccountId;
  }

  return new Stripe(secretKey, stripeOptions);
}

/**
 * Get environment-specific publishable key
 */
export function getPublishableKey(environment: 'test' | 'production' = 'test'): string {
  return getEnvVar(
    environment === 'test'
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_STRIPE_PRODUCTION_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  );
}