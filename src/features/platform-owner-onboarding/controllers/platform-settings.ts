'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { PlatformSettings, PlatformSettingsInsert, PlatformSettingsUpdate } from '../types';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

/**
 * Retrieves the platform settings.
 * Assumes there is only one platform settings record.
 */
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
    console.error('Error fetching platform settings:', error);
    return null; // Return null on error instead of throwing
  }

  return data;
}

/**
 * Retrieves the platform settings for the given owner ID.
 * If no settings exist, it creates a new default entry.
 */
export async function getOrCreatePlatformSettings(ownerId: string): Promise<PlatformSettings> {
  let existingProfile = await getPlatformSettings();
  
  if (existingProfile && existingProfile.owner_id === ownerId) {
    return existingProfile;
  }

  // If no existing profile or owner_id mismatch, create one
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
    onboarding_step: 1, // Initialize the step
    default_creator_brand_color: '#ea580c', // Default orange
    default_creator_gradient: { type: 'linear', colors: ['#ea580c', '#f59e0b'], direction: 45 },
    default_creator_pattern: { type: 'none', intensity: 0.1, angle: 0 },
    default_white_labeled_page_config: {
      heroTitle: 'Welcome to SaaSinaSnap',
      heroSubtitle: 'SaaS in a Snap - Launch your business with ease',
      ctaText: 'Get Started',
      showTestimonials: true,
      showPricing: true,
      showFaq: true,
    },
  };

  const supabaseAdmin = await createSupabaseAdminClient();
  const { data: newSettings, error: insertError } = await supabaseAdmin
    .from('platform_settings')
    .insert(defaultSettings)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating default platform settings:', insertError);
    throw insertError;
  }

  // Set the user's role to 'platform_owner' ONLY upon initial creation of platform settings.
  await supabaseAdmin
    .from('users')
    .update({ role: 'platform_owner' })
    .eq('id', ownerId);

  return newSettings;
}

/**
 * Updates the platform settings for a given owner ID.
 */
export async function updatePlatformSettings(ownerId: string, updates: PlatformSettingsUpdate): Promise<PlatformSettings> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .update(updates)
    .eq('owner_id', ownerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating platform settings:', error);
    throw error;
  }

  return data;
}