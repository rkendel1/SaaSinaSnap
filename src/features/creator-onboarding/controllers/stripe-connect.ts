'use server';

    import { stripeAdmin } from '@/libs/stripe/stripe-admin';
    import { getURL } from '@/utils/get-url';
    import Stripe from 'stripe';

    import type { StripeConnectAccount } from '../types';

    /**
     * Generates a Stripe OAuth URL for connecting a Standard account.
     */
    export async function generateStripeOAuthLink(creatorId: string, email: string): Promise<string> {
      const connectUrl = new URL('https://connect.stripe.com/oauth/authorize');
      connectUrl.searchParams.set('response_type', 'code');
      connectUrl.searchParams.set('scope', 'read_write'); // Request necessary permissions
      connectUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID!); // Use the correct Client ID
      connectUrl.searchParams.set('redirect_uri', `${getURL()}/api/stripe-oauth-callback`);
      connectUrl.searchParams.set('state', creatorId); // Pass creatorId to retrieve it in the callback
      connectUrl.searchParams.set('stripe_user[email]', email); // Pre-fill email for convenience
      connectUrl.searchParams.set('stripe_user[business_type]', 'individual'); // Default to individual, can be customized

      return connectUrl.toString();
    }

    /**
     * Exchanges the authorization code for Stripe access and refresh tokens.
     */
    export async function exchangeStripeOAuthCodeForTokens(code: string): Promise<{
      accessToken: string;
      refreshToken: string;
      stripeUserId: string;
    }> {
      const response = await stripeAdmin.oauth.token({
        grant_type: 'authorization_code',
        code,
      });

      if (!response.access_token || !response.refresh_token || !response.stripe_user_id) {
        throw new Error('Failed to exchange code for tokens');
      }

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        stripeUserId: response.stripe_user_id,
      };
    }

    /**
     * Retrieves a Stripe Connect account using the provided access token.
     */
    export async function getStripeConnectAccount(accessToken: string): Promise<StripeConnectAccount> {
      // Use the provided access token to make the API call on behalf of the connected account
      const account = await stripeAdmin.accounts.retrieve(
        {
          stripeAccount: accessToken, // Pass the access token as stripeAccount
        }
      );
      
      return {
        id: account.id,
        type: account.type || 'standard', // Default to standard for OAuth
        business_profile: account.business_profile as StripeConnectAccount['business_profile'] || undefined,
        capabilities: account.capabilities || {},
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
      };
    }

    // The following functions will need to be updated to use the creator's access token
    // when interacting with their Stripe account. For now, they remain as is,
    // but note that they currently use the platform's secret key.
    export async function createStripeProduct(accessToken: string, productData: {
      name: string;
      description?: string;
      metadata?: Record<string, string>;
      images?: string[];
      statement_descriptor?: string;
      unit_label?: string;
      active?: boolean;
    }): Promise<string> {
      const product = await stripeAdmin.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata || {},
        images: productData.images || [],
        statement_descriptor: productData.statement_descriptor,
        unit_label: productData.unit_label,
        active: productData.active !== undefined ? productData.active : true,
      }, {
        stripeAccount: accessToken, // Use the creator's access token
      });

      return product.id;
    }

    export async function createStripePrice(accessToken: string, priceData: {
      product: string;
      unit_amount: number;
      currency: string;
      recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count?: number;
        trial_period_days?: number;
        usage_type?: 'metered' | 'licensed';
        aggregate_usage?: 'sum' | 'last_during_period' | 'last_ever' | 'max';
      };
      billing_scheme?: 'per_unit' | 'tiered';
      tiers?: Array<{
        up_to: number | 'inf';
        flat_amount?: number;
        unit_amount?: number;
      }>;
      transform_quantity?: {
        divide_by: number;
        round: 'up' | 'down';
      };
    }): Promise<string> {
      const price = await stripeAdmin.prices.create(priceData, {
        stripeAccount: accessToken, // Use the creator's access token
      });

      return price.id;
    }

    export async function createPaymentIntent(
      accessToken: string,
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
          destination: accessToken, // Destination is the connected account ID (which is the access token for Standard)
        },
      });

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
      };
    }

    // Enhanced product management functions
    export async function updateStripeProduct(accessToken: string, productId: string, productData: {
      name?: string;
      description?: string;
      metadata?: Record<string, string>;
      images?: string[];
      statement_descriptor?: string;
      unit_label?: string;
      active?: boolean;
    }): Promise<void> {
      await stripeAdmin.products.update(productId, productData, {
        stripeAccount: accessToken,
      });
    }

    export async function archiveStripeProduct(accessToken: string, productId: string): Promise<void> {
      await stripeAdmin.products.update(productId, { active: false }, {
        stripeAccount: accessToken,
      });
    }

    export async function deleteStripeProduct(accessToken: string, productId: string): Promise<void> {
      await stripeAdmin.products.del(productId, {
        stripeAccount: accessToken,
      });
    }

    export async function getStripeProduct(accessToken: string, productId: string) {
      return await stripeAdmin.products.retrieve(productId, {
        stripeAccount: accessToken,
      });
    }

    export async function listStripeProducts(accessToken: string, options?: {
      active?: boolean;
      limit?: number;
      starting_after?: string;
      ending_before?: string;
    }) {
      return await stripeAdmin.products.list(options || {}, {
        stripeAccount: accessToken,
      });
    }

    export async function updateStripePrice(accessToken: string, priceId: string, priceData: {
      active?: boolean;
      metadata?: Record<string, string>;
    }): Promise<void> {
      await stripeAdmin.prices.update(priceId, priceData, {
        stripeAccount: accessToken,
      });
    }

    export async function archiveStripePrice(accessToken: string, priceId: string): Promise<void> {
      await stripeAdmin.prices.update(priceId, { active: false }, {
        stripeAccount: accessToken,
      });
    }