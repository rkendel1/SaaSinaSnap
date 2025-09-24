'use server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { PlatformSettings, PlatformSettingsInsert, PlatformSettingsUpdate } from '../types';

/**
 * Retrieves the platform settings for the given owner ID.
 * If no settings exist, it creates a new default entry.
 */
export async function getOrCreatePlatformSettings(ownerId: string): Promise<PlatformSettings> {
  const { data, error } = await supabaseAdminClient
    .from('platform_settings')
    .select('*')
    .eq('owner_id', ownerId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error('Error fetching platform settings:', error);
    throw error;
  }

  if (data) {
    // Ensure the user's role is set if they are the platform owner
    await supabaseAdminClient
      .from('users')
      .update({ role: 'platform_owner' })
      .eq('id', ownerId);
    return data;
  }

  // If no settings found, create a default one
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
    onboarding_step: 1, // Initialize the step
    default_creator_brand_color: '#3b82f6', // Default blue
    default_creator_gradient: { type: 'linear', colors: ['#3b82f6', '#0ea5e9'], direction: 45 },
    default_creator_pattern: { type: 'none', intensity: 0.1, angle: 0 },
    default_white_labeled_page_config: {
      heroTitle: 'Welcome to Your New SaaS',
      heroSubtitle: 'Launch your business with ease',
      ctaText: 'Get Started',
      showTestimonials: true,
      showPricing: true,
      showFaq: true,
    },
  };

  const { data: newSettings, error: insertError } = await supabaseAdminClient
    .from('platform_settings')
    .insert(defaultSettings)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating default platform settings:', insertError);
    throw insertError;
  }

  // Set the user's role to 'platform_owner' upon creation of platform settings
  await supabaseAdminClient
    .from('users')
    .update({ role: 'platform_owner' })
    .eq('id', ownerId);

  return newSettings;
}

/**
 * Updates the platform settings for a given owner ID.
 */
export async function updatePlatformSettings(ownerId: string, updates: PlatformSettingsUpdate): Promise<PlatformSettings> {
  const { data, error } = await supabaseAdminClient
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