'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { PlatformSettings, PlatformSettingsInsert, PlatformSettingsUpdate } from '../types';

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
 * This function now includes logic to prevent multiple platform owners.
 */
export async function getOrCreatePlatformSettings(ownerId: string): Promise<PlatformSettings> {
  const supabaseAdmin = await createSupabaseAdminClient();
  
  // First, check if any platform settings already exist
  let existingProfile = await getPlatformSettings();
  
  if (existingProfile) {
    // If settings exist and this user is the owner, return the settings
    if (existingProfile.owner_id === ownerId) {
      return existingProfile;
    }
    
    // If settings exist but this user is not the owner, they should not become platform owner
    throw new Error('Platform owner already exists. This user should be redirected to creator onboarding.');
  }

  // No existing platform settings, so this user can become the platform owner
  // Double-check that this is truly the first user by looking at user count
  const { count: userCount, error: countError } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting users:', countError);
    throw new Error('Unable to verify user count for platform owner assignment');
  }

  // Only allow platform owner creation if this is one of the first few users
  if ((userCount ?? 0) > 3) {
    throw new Error('Platform owner can only be assigned to the first users. This user should be a creator.');
  }

  // Create platform owner settings
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
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
  const { error: roleUpdateError } = await supabaseAdmin
    .from('users')
    .upsert({ 
      id: ownerId, 
      role: 'platform_owner',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (roleUpdateError) {
    console.error('Error setting platform owner role:', roleUpdateError);
    // Don't throw here as the settings were created successfully
  }

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