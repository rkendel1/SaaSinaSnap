'use server';

import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { generateStripeOAuthLink } from '@/features/creator-onboarding/controllers/stripe-connect';

import { getOrCreatePlatformSettings, updatePlatformSettings } from '../controllers/platform-settings';
import type { PlatformSettingsUpdate } from '../types';

/**
 * Initializes or retrieves platform settings for the current user.
 * Redirects to login if not authenticated.
 */
export async function initializePlatformOwnerOnboardingAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const settings = await getOrCreatePlatformSettings(user.id);
  return settings;
}

/**
 * Updates the platform settings.
 */
export async function updatePlatformOwnerSettingsAction(updates: PlatformSettingsUpdate) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(user.id, updates);
}

/**
 * Marks a specific step of the platform owner onboarding as complete.
 */
export async function completePlatformOnboardingStepAction(step: number) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  const isCompleted = step >= 6; // Onboarding is complete after step 6 (was 7, now 6 after removing branding step)

  return updatePlatformSettings(user.id, {
    platform_owner_onboarding_completed: isCompleted,
    onboarding_step: isCompleted ? step : nextStep,
  });
}

/**
 * Creates a Stripe Connect onboarding link specifically for the platform owner.
 */
export async function createPlatformStripeConnectAccountAction(environment: 'test' | 'production' = 'test'): Promise<{ onboardingUrl: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  const onboardingUrl = await generateStripeOAuthLink(user.id, user.email, 'platform_owner', environment);
  return { onboardingUrl };
}