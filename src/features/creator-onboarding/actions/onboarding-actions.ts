'use server';

import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import type { ColorPalette } from '@/utils/color-palette-utils';

import { getBrandingSuggestions, getOrCreateCreatorProfile, updateCreatorProfile } from '../controllers/creator-profile';
import { generateStripeOAuthLink } from '../controllers/stripe-connect'; // Import the new function
import type { CreatorProfileUpdate } from '../types';

export async function updateCreatorProfileAction(profileData: CreatorProfileUpdate) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProfile(user.id, profileData); // Use user.id directly
}

export async function createStripeConnectAccountAction(): Promise<{ onboardingUrl: string }> {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  try {
    // Generate the OAuth link for Standard accounts
    const onboardingUrl = await generateStripeOAuthLink(user.id, user.email); // Use user.id and user.email directly

    // We don't update stripe_account_id here, it will be updated in the callback route
    // after the user completes the OAuth flow.

    return { onboardingUrl };
  } catch (error) {
    console.error('Error generating Stripe OAuth link:', error);
    throw new Error('Failed to generate Stripe Connect link');
  }
}

export async function completeOnboardingStepAction(step: number) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  const isCompleted = nextStep > 7; // Adjusted from 8 to 7 total steps

  return updateCreatorProfile(user.id, { // Use user.id directly
    onboarding_step: isCompleted ? step : nextStep,
    onboarding_completed: isCompleted,
  });
}

export async function initializeCreatorOnboardingAction() {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    redirect('/login');
  }

  // Get or create creator profile
  const profile = await getOrCreateCreatorProfile(user.id); // Use user.id directly

  if (profile.onboarding_completed) {
    redirect('/creator/dashboard');
  }

  return profile;
}

export async function getBrandingSuggestionsAction() {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return getBrandingSuggestions(user.id); // Use user.id directly
}

export async function applyColorPaletteAction(palette: ColorPalette) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProfile(user.id, { // Use user.id directly
    brand_color: palette.primary,
    brand_gradient: palette.gradient as any,
    brand_pattern: palette.pattern as any,
  });
}