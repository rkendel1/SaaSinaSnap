'use server';

    import Stripe from 'stripe';

    import { stripeAdmin } from '@/libs/stripe/stripe-admin';
    import { getURL } from '@/utils/get-url';
    import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
    import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

    import type { StripeConnectAccount } from '../types';

    /**
     * Generates a Stripe OAuth URL for connecting a Standard account.
     */
    export async function generateStripeOAuthLink(userId: string, email: string, flow: 'creator' | 'platform_owner'): Promise<string> {
      const connectUrl = new URL('https://connect.stripe.com/oauth/authorize');
      connectUrl.searchParams.set('response_type', 'code');
      connectUrl.searchParams.set('scope', 'read_write'); // Request necessary permissions
      connectUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID!); // Use the correct Client ID
      connectUrl.searchParams.set('redirect_uri', `${getURL()}/api/stripe-oauth-callback`);
      connectUrl.searchParams.set('state', `${userId}|${flow}`); // Pass userId and flow type
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
     * Retrieves a Stripe Connect account using the provided account ID.
     */
    export async function getStripeConnectAccount(accountId: string): Promise<StripeConnectAccount> {
      const account = await stripeAdmin.accounts.retrieve(accountId);
      
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

    /**
     * Extracts profile data from a Stripe Connect account for autopopulation.
     */
    export async function extractProfileDataFromStripeAccount(accountId: string): Promise<{
      business_name?: string;
      business_email?: string;
      business_website?: string;
      billing_email?: string;
      billing_phone?: string;
      billing_address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
      business_logo_url?: string; // Added for logo extraction
    }> {
      try {
        const account = await stripeAdmin.accounts.retrieve(accountId);

        const profileData: any = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // --- Business Name ---
        if (account.business_profile?.name?.trim()) {
          profileData.business_name = account.business_profile.name.trim();
        } else if (account.company?.name?.trim()) {
          profileData.business_name = account.company.name.trim();
        } else if (account.settings?.dashboard?.display_name?.trim()) { // Check dashboard display name
          profileData.business_name = account.settings.dashboard.display_name.trim();
        } else if (account.individual?.first_name?.trim() && account.individual?.last_name?.trim()) {
          profileData.business_name = `${account.individual.first_name.trim()} ${account.individual.last_name.trim()}`;
        }

        // --- Business Email & Billing Email ---
        if (account.business_profile?.support_email?.trim()) {
          const trimmedEmail = account.business_profile.support_email.trim();
          if (emailRegex.test(trimmedEmail)) {
            profileData.business_email = trimmedEmail;
            profileData.billing_email = trimmedEmail;
          }
        } else if (account.individual?.email?.trim()) {
          const trimmedEmail = account.individual.email.trim();
          if (emailRegex.test(trimmedEmail)) {
            profileData.business_email = trimmedEmail;
            profileData.billing_email = trimmedEmail;
          }
        }

        // --- Business Website ---
        if (account.business_profile?.url?.trim()) {
          const trimmedUrl = account.business_profile.url.trim();
          try {
            new URL(trimmedUrl); // Validate URL format
            profileData.business_website = trimmedUrl;
          } catch {}
        }

        // --- Billing Phone ---
        if (account.business_profile?.support_phone?.trim()) {
          profileData.billing_phone = account.business_profile.support_phone.trim();
        } else if (account.individual?.phone?.trim()) {
          profileData.billing_phone = account.individual.phone.trim();
        } else if (account.company?.phone?.trim()) {
          profileData.billing_phone = account.company.phone.trim();
        }

        // --- Billing Address ---
        let address = null;
        if (account.company?.address) {
          address = account.company.address;
        } else if (account.individual?.address) {
          address = account.individual.address;
        } 
        // Removed: else if (account.settings?.billing?.address) { // Check billing settings address
        // Removed:   address = account.settings.billing.address;
        // Removed: }

        if (address) {
          profileData.billing_address = {
            line1: address.line1?.trim() || '',
            line2: address.line2?.trim() || '',
            city: address.city?.trim() || '',
            state: address.state?.trim() || '',
            postal_code: address.postal_code?.trim() || '',
            country: address.country?.trim() || '',
          };
        }

        // --- Business Logo URL (Stripe does not directly provide a logo URL for connected accounts via API) ---
        // This would typically be handled by a separate asset upload or branding extraction service.
        // For now, we'll leave it as is, or you could add a placeholder if desired.
        // if (account.settings?.branding?.icon) { // This is for platform branding, not connected account logo
        //   profileData.business_logo_url = account.settings.branding.icon;
        // }

        return profileData;
      } catch (error) {
        console.error('Error extracting profile data from Stripe account:', error);
        return {};
      }
    }

    export async function createStripeProduct(accountId: string, productData: {
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
      const applicationFeeAmount = Math.round(amount * 0.05);

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

    export async function updateStripeProduct(accountId: string, productId: string, productData: {
      name?: string;
      description?: string;
      metadata?: Record<string, string>;
      images?: string[];
      statement_descriptor?: string;
      unit_label?: string;
      active?: boolean;
    }): Promise<void> {
      await stripeAdmin.products.update(productId, productData, {
        stripeAccount: accountId,
      });
    }

    export async function archiveStripeProduct(accountId: string, productId: string): Promise<void> {
      await stripeAdmin.products.update(productId, { active: false }, {
        stripeAccount: accountId,
      });
    }

    export async function deleteStripeProduct(accountId: string, productId: string): Promise<void> {
      await stripeAdmin.products.del(productId, {
        stripeAccount: accountId,
      });
    }

    export async function getStripeProduct(accountId: string, productId: string) {
      return await stripeAdmin.products.retrieve(productId, {
        stripeAccount: accountId,
      });
    }

    export async function listStripeProducts(accountId: string, options?: {
      active?: boolean;
      limit?: number;
      starting_after?: string;
      ending_before?: string;
    }) {
      return await stripeAdmin.products.list(options || {}, {
        stripeAccount: accountId,
      });
    }

    export async function updateStripePrice(accountId: string, priceId: string, priceData: {
      active?: boolean;
      metadata?: Record<string, string>;
    }): Promise<void> {
      await stripeAdmin.prices.update(priceId, priceData, {
        stripeAccount: accountId,
      });
    }

    export async function archiveStripePrice(accountId: string, priceId: string): Promise<void> {
      await stripeAdmin.prices.update(priceId, { active: false }, {
        stripeAccount: accountId,
      });
    }