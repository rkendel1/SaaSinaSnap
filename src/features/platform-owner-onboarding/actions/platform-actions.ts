'use server';

import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { getOrCreatePlatformSettings, updatePlatformSettings } from '../controllers/platform-settings';
import type { DefaultCreatorBranding, DefaultWhiteLabeledPageConfig, PlatformSettingsUpdate } from '../types';

/**
 * Initializes or retrieves platform settings for the current user.
 * Redirects to login if not authenticated.
 */
export async function initializePlatformOwnerOnboardingAction() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const settings = await getOrCreatePlatformSettings(session.user.id);
  return settings;
}

/**
 * Updates the platform settings.
 */
export async function updatePlatformOwnerSettingsAction(updates: PlatformSettingsUpdate) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(session.user.id, updates);
}

/**
 * Saves default creator branding settings.
 */
export async function saveDefaultCreatorBrandingAction(branding: DefaultCreatorBranding) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(session.user.id, {
    default_creator_brand_color: branding.brandColor,
    default_creator_gradient: branding.brandGradient as any, // Cast to any for JSONB
    default_creator_pattern: branding.brandPattern as any,   // Cast to any for JSONB
  });
}

/**
 * Saves default white-labeled page configuration.
 */
export async function saveDefaultWhiteLabeledPageConfigAction(config: DefaultWhiteLabeledPageConfig) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  return updatePlatformSettings(session.user.id, {
    default_white_labeled_page_config: config as any, // Cast to any for JSONB
  });
}

/**
 * Marks a specific step of the platform owner onboarding as complete.
 */
export async function completePlatformOnboardingStepAction(step: number) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  const isCompleted = nextStep > 6; // Assuming 6 total steps for platform owner onboarding

  return updatePlatformSettings(session.user.id, {
    platform_owner_onboarding_completed: isCompleted,
    // Optionally update a current_onboarding_step field if we want to track progress
  });
}