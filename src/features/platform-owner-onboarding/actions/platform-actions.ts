"use server";

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

  try {
    return await updatePlatformSettings(user.id, updates);
  } catch (error) {
    console.error('[PlatformActions] Error in updatePlatformOwnerSettingsAction:', error);
    throw new Error(`Failed to update platform settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Marks a specific step of the platform owner onboarding as complete.
 */
export async function completePlatformOnboardingStepAction(step: number) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const totalSteps = 6; // There are 6 steps in PLATFORM_ONBOARDING_STEPS
  const isCompleted = step >= totalSteps; // Onboarding is complete when the last step (6) is processed

  try {
    return await updatePlatformSettings(user.id, {
      platform_owner_onboarding_completed: isCompleted,
      onboarding_step: isCompleted ? (totalSteps + 1) : (step + 1), // Set to totalSteps + 1 when completed
    });
  } catch (error) {
    console.error('[PlatformActions] Error in completePlatformOnboardingStepAction:', error);
    throw new Error(`Failed to complete onboarding step: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a Stripe Connect onboarding link specifically for the platform owner.
 */
export async function createPlatformStripeConnectAccountAction(environment: 'test' | 'production' = 'test'): Promise<{ onboardingUrl: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  try {
    const onboardingUrl = await generateStripeOAuthLink(user.id, user.email, 'platform_owner', environment);
    return { onboardingUrl };
  } catch (error) {
    console.error('[PlatformActions] Error in createPlatformStripeConnectAccountAction:', error);
    throw new Error(`Failed to create Stripe Connect account link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Saves default creator branding settings to platform settings.
 */
export async function saveDefaultCreatorBrandingAction(branding: DefaultCreatorBranding) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    return await updatePlatformSettings(user.id, {
      default_creator_brand_color: branding.brandColor,
      default_creator_gradient: branding.brandGradient as any,
      default_creator_pattern: branding.brandPattern as any,
    });
  } catch (error) {
    console.error('[PlatformActions] Error in saveDefaultCreatorBrandingAction:', error);
    throw new Error(`Failed to save default creator branding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Saves default white-labeled page configuration to platform settings.
 */
export async function saveDefaultWhiteLabeledPageConfigAction(config: DefaultWhiteLabeledPageConfig) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    return await updatePlatformSettings(user.id, {
      default_white_labeled_page_config: config as any,
    });
  } catch (error) {
    console.error('[PlatformActions] Error in saveDefaultWhiteLabeledPageConfigAction:', error);
    throw new Error(`Failed to save default white-labeled page config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}