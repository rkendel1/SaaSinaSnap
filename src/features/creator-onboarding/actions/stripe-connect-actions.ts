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

  // Fetch creator profile to get stripe_access_token
  const { data: creatorProfile, error } = await supabaseAdminClient
    .from('creator_profiles')
    .select('stripe_access_token')
    .eq('id', user.id) // Use user.id directly
    .single();

  if (error || !creatorProfile?.stripe_access_token) {
    console.error('Error fetching creator profile or stripe_access_token:', error);
    return null;
  }

  try {
    // Pass the access token to the controller function
    return await getStripeConnectAccountController(creatorProfile.stripe_access_token);
  } catch (err) {
    console.error('Error fetching Stripe Connect account:', err);
    return null;
  }
}