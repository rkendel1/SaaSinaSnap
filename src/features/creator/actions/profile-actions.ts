'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { BillingAddress } from '@/features/creator-onboarding/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { AddressParam } from '@stripe/stripe-js';

/**
 * Updates the creator's page slug (custom domain/subdomain) in their profile.
 */
export async function updateCreatorPageSlugAction(newSlug: string) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // Sanitize the newSlug to ensure it's a valid URL slug
  let cleanedSlug = newSlug.trim().toLowerCase();

  // Remove protocol (http/https)
  cleanedSlug = cleanedSlug.replace(/^(https?:\/\/)/, '');
  // Remove www.
  cleanedSlug = cleanedSlug.replace(/^www\./, '');
  // Remove top-level domain (e.g., .com, .org, .net)
  // This regex is more robust for various TLDs and subdomains
  cleanedSlug = cleanedSlug.replace(/\.[a-z0-9-]{2,6}(?:\.[a-z0-9-]{2})?$/, '');
  // Replace non-alphanumeric characters (except hyphens) with hyphens
  cleanedSlug = cleanedSlug.replace(/[^a-z0-9-]/g, '-');
  // Remove leading/trailing hyphens
  cleanedSlug = cleanedSlug.replace(/^-+|-+$/g, '');
  // Replace multiple hyphens with a single hyphen
  cleanedSlug = cleanedSlug.replace(/-+/g, '-');

  if (!cleanedSlug) {
    throw new Error('Page slug cannot be empty after sanitization. Please enter a valid name or URL.');
  }

  const updatedProfile = await updateCreatorProfile(user.id, {
    page_slug: cleanedSlug,
  });

  // Revalidate paths related to the old and new slug
  revalidatePath(`/c/${user.id}`); // Old default slug
  revalidatePath(`/c/${cleanedSlug}`); // New slug
  revalidatePath('/creator/profile'); // Profile page itself
  revalidatePath('/creator/dashboard'); // Dashboard might show the link

  return updatedProfile;
}

/**
 * Updates the Stripe customer's billing details for the authenticated user.
 * Requires explicit user approval.
 */
export async function updateStripeCustomerBillingDetailsAction(
  newBillingEmail: string,
  newBillingPhone: string,
  newBillingAddress: BillingAddress
): Promise<{ success: boolean; message?: string; error?: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  // 1. Get the creator profile to retrieve Stripe access token
  const creatorProfile = await updateCreatorProfile(user.id, {}); // Fetch latest profile
  if (!creatorProfile?.stripe_access_token || !creatorProfile?.stripe_account_id) {
    return { success: false, error: 'Creator Stripe account not connected or access token missing.' };
  }

  // 2. Get the Stripe customer ID for the user
  const stripeCustomerId = await getCustomerId({ userId: user.id });
  if (!stripeCustomerId) {
    return { success: false, error: 'Stripe customer ID not found for this user.' };
  }

  try {
    // 3. Update the Stripe customer
    await stripeAdmin.customers.update(
      stripeCustomerId,
      {
        email: newBillingEmail,
        phone: newBillingPhone,
        address: newBillingAddress as AddressParam, // Cast to Stripe's AddressParam
      },
      {
        stripeAccount: creatorProfile.stripe_access_token, // Use the creator's access token
      }
    );

    return { success: true, message: 'Stripe billing details updated successfully.' };
  } catch (stripeError) {
    console.error('Error updating Stripe customer billing details:', stripeError);
    return { success: false, error: `Failed to update Stripe billing details: ${(stripeError as Error).message}` };
  }
}