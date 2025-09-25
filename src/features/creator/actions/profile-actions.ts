'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { BillingAddress } from '@/features/creator-onboarding/types';
import { AddressParam } from '@stripe/stripe-js';

/**
 * Updates the creator's page slug (custom domain/subdomain) in their profile.
 */
export async function updateCreatorPageSlugAction(newSlug: string) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // Basic validation for the slug
  const cleanedSlug = newSlug.trim().toLowerCase();
  if (!cleanedSlug) {
    throw new Error('Page slug cannot be empty.');
  }
  // Further validation (e.g., no special characters, length) could be added here.

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
  const { data: creatorProfile, error: profileError } = await updateCreatorProfile(user.id, {}); // Fetch latest profile
  if (profileError || !creatorProfile?.stripe_access_token || !creatorProfile?.stripe_account_id) {
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