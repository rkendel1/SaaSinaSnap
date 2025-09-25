'use server';

import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { generateStripeOAuthLink } from '@/features/creator-onboarding/controllers/stripe-connect';

import { getOrCreatePlatformSettings, updatePlatformSettings } from '../controllers/platform-settings';
import type { DefaultCreatorBranding, DefaultWhiteLabeledPageConfig, PlatformSettingsUpdate } from '../types';

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
 * Saves default creator branding settings.
 */
export async function saveDefaultCreatorBrandingAction(branding: DefaultCreatorBranding) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(user.id, {
    default_creator_brand_color: branding.brandColor,
    default_creator_gradient: branding.brandGradient as any, // Cast to any for JSONB
    default_creator_pattern: branding.brandPattern as any,   // Cast to any for JSONB
  });
}

/**
 * Saves default white-labeled page configuration.
 */
export async function saveDefaultWhiteLabeledPageConfigAction(config: DefaultWhiteLabeledPageConfig) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(user.id, {
    default_white_labeled_page_config: config as any, // Cast to any for JSONB
  });
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
  const isCompleted = step >= 7; // Onboarding is complete after step 7

  return updatePlatformSettings(user.id, {
    platform_owner_onboarding_completed: isCompleted,
    onboarding_step: isCompleted ? step : nextStep,
  });
}

/**
 * Creates a Stripe Connect onboarding link specifically for the platform owner.
 */
export async function createPlatformStripeConnectAccountAction(): Promise<{ onboardingUrl: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  const onboardingUrl = await generateStripeOAuthLink(user.id, user.email, 'platform_owner');
  return { onboardingUrl };
}