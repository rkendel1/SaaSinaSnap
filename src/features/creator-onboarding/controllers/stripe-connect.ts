"use server";

import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getURL } from '@/utils/get-url';

import type { StripeConnectAccount } from '../types';

/**
 * Generates a Stripe OAuth URL for connecting a Standard account.
 */
export async function generateStripeOAuthLink(
  userId: string, 
  email: string, 
  flow: 'creator' | 'platform_owner',
  environment: 'test' | 'production' = 'test'
): Promise<string> {
  const redirectUri = `${getURL()}/api/stripe-oauth-callback`;
  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID!;

  console.log('Stripe OAuth: Generating link with Client ID:', clientId);
  console.log('Stripe OAuth: Redirect URI:', redirectUri);

  const connectUrl = new URL('https://connect.stripe.com/oauth/authorize');
  connectUrl.searchParams.set('response_type', 'code');
  connectUrl.searchParams.set('scope', 'read_write'); // Request necessary permissions
  connectUrl.searchParams.set('client_id', clientId); // Use the correct Client ID
  connectUrl.searchParams.set('redirect_uri', redirectUri);
  connectUrl.searchParams.set('state', `${userId}|${flow}|${environment}`); // Pass userId, flow type, and environment
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
  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID!;
  const redirectUri = `${getURL()}/api/stripe-oauth-callback`;

  console.log('Stripe OAuth: Exchanging code for tokens with Client ID:', clientId);
  console.log('Stripe OAuth: Redirect URI for token exchange:', redirectUri);
  console.log('Stripe OAuth: Authorization Code:', code);

  const response = await stripeAdmin.oauth.token({
    grant_type: 'authorization_code',
    code,
    client_id: clientId, // Explicitly pass client_id for clarity
    redirect_uri: redirectUri, // Explicitly pass redirect_uri for clarity
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
  try {
    console.log('[Stripe Connect] Creating product', { 
      accountId, 
      productName: productData.name,
      hasDescription: !!productData.description,
      imageCount: productData.images?.length || 0
    });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate product name
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required');
    }

    const product = await stripeAdmin.products.create({
      name: productData.name,
      description: productData.description || undefined,
      metadata: productData.metadata || {},
      images: productData.images || [],
      statement_descriptor: productData.statement_descriptor,
      unit_label: productData.unit_label,
      active: productData.active !== undefined ? productData.active : true,
    }, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Product created successfully', { 
      productId: product.id,
      accountId 
    });
    
    return product.id;
  } catch (error: any) {
    console.error('[Stripe Connect] Product creation failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      productName: productData.name
    });
    throw error;
  }
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
  try {
    console.log('[Stripe Connect] Creating price', { 
      accountId, 
      productId: priceData.product,
      unitAmount: priceData.unit_amount,
      currency: priceData.currency,
      isRecurring: !!priceData.recurring
    });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate product ID
    if (!priceData.product || priceData.product.trim() === '') {
      throw new Error('Product ID is required');
    }

    // Validate price amount
    if (priceData.unit_amount === undefined || priceData.unit_amount === null || priceData.unit_amount < 0) {
      throw new Error('Unit amount must be a non-negative number');
    }

    // Validate currency
    if (!priceData.currency || priceData.currency.trim() === '') {
      throw new Error('Currency is required');
    }

    const price = await stripeAdmin.prices.create(priceData, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Price created successfully', { 
      priceId: price.id,
      accountId 
    });
    
    return price.id;
  } catch (error: any) {
    console.error('[Stripe Connect] Price creation failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      productId: priceData.product
    });
    throw error;
  }
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
  try {
    console.log('[Stripe Connect] Updating product', { 
      accountId, 
      productId,
      updateFields: Object.keys(productData)
    });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate product ID
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required');
    }

    await stripeAdmin.products.update(productId, productData, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Product updated successfully', { 
      productId,
      accountId 
    });
  } catch (error: any) {
    console.error('[Stripe Connect] Product update failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      productId
    });
    throw error;
  }
}

export async function archiveStripeProduct(accountId: string, productId: string): Promise<void> {
  try {
    console.log('[Stripe Connect] Archiving product', { accountId, productId });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate product ID
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required');
    }

    await stripeAdmin.products.update(productId, { active: false }, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Product archived successfully', { 
      productId,
      accountId 
    });
  } catch (error: any) {
    console.error('[Stripe Connect] Product archive failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      productId
    });
    throw error;
  }
}

export async function deleteStripeProduct(accountId: string, productId: string): Promise<void> {
  try {
    console.log('[Stripe Connect] Deleting product', { accountId, productId });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate product ID
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required');
    }

    await stripeAdmin.products.del(productId, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Product deleted successfully', { 
      productId,
      accountId 
    });
  } catch (error: any) {
    console.error('[Stripe Connect] Product deletion failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      productId
    });
    throw error;
  }
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
  try {
    console.log('[Stripe Connect] Updating price', { 
      accountId, 
      priceId,
      updateFields: Object.keys(priceData)
    });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate price ID
    if (!priceId || priceId.trim() === '') {
      throw new Error('Price ID is required');
    }

    await stripeAdmin.prices.update(priceId, priceData, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Price updated successfully', { 
      priceId,
      accountId 
    });
  } catch (error: any) {
    console.error('[Stripe Connect] Price update failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      priceId
    });
    throw error;
  }
}

export async function archiveStripePrice(accountId: string, priceId: string): Promise<void> {
  try {
    console.log('[Stripe Connect] Archiving price', { accountId, priceId });

    // Validate account ID
    if (!accountId || accountId.trim() === '') {
      throw new Error('Stripe account ID is required');
    }

    // Validate price ID
    if (!priceId || priceId.trim() === '') {
      throw new Error('Price ID is required');
    }

    await stripeAdmin.prices.update(priceId, { active: false }, {
      stripeAccount: accountId,
    });

    console.log('[Stripe Connect] Price archived successfully', { 
      priceId,
      accountId 
    });
  } catch (error: any) {
    console.error('[Stripe Connect] Price archive failed', { 
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
      accountId,
      priceId
    });
    throw error;
  }
}