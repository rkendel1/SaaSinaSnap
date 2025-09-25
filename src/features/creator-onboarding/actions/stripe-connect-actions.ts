'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { getStripeConnectAccount as getStripeConnectAccountController } from '../controllers/stripe-connect';
import type { StripeConnectAccount } from '../types';

/**
 * Server action to fetch a creator's Stripe Connect account details.
 * This ensures that the Stripe API key is only used on the server.
 */
export async function getStripeConnectAccountAction(): Promise<StripeConnectAccount | null> {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    // Not authenticated, cannot fetch Stripe account
    return null;
  }

  // Fetch creator profile to get stripe_account_id
  const { data: creatorProfile, error } = await supabaseAdminClient
    .from('creator_profiles')
    .select('stripe_account_id')
    .eq('id', user.id) // Use user.id directly
    .single();

  if (error || !creatorProfile?.stripe_account_id) {
    console.error('Error fetching creator profile or stripe_account_id:', error);
    return null;
  }

  try {
    // Pass the account ID to the controller function
    return await getStripeConnectAccountController(creatorProfile.stripe_account_id);
  } catch (err) {
    console.error('Error fetching Stripe Connect account:', err);
    return null;
  }
}