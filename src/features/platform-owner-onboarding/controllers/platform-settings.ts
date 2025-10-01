"use server";

import { revalidatePath } from 'next/cache';

import { ensureDbUser } from '@/features/account/controllers/ensure-db-user';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { serializeForClient } from '@/utils/serialize-for-client';

import type { PlatformSettings, PlatformSettingsInsert, PlatformSettingsUpdate } from '../types';

/**
 * Retrieves the platform settings for a given owner ID.
 */
export async function getPlatformSettings(ownerId: string): Promise<PlatformSettings | null> {
  console.log('[PlatformSettings] getPlatformSettings called for owner:', ownerId);
  
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('*')
    .eq('owner_id', ownerId) // Filter by owner_id
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
    console.error('[PlatformSettings] Error fetching platform settings:', error);
    return null; // Return null on error instead of throwing
  }

  if (error && error.code === 'PGRST116') {
    console.log('[PlatformSettings] No platform settings found for owner:', ownerId);
    return null;
  }

  console.log('[PlatformSettings] Platform settings found for owner:', ownerId);
  return serializeForClient(data);
}

/**
 * Retrieves the platform settings for the given owner ID.
 * If no settings exist, it creates a new default entry.
 */
export async function getOrCreatePlatformSettings(ownerId: string): Promise<PlatformSettings> {
  console.log('[PlatformSettings] getOrCreatePlatformSettings called for owner:', ownerId);
  
  let existingProfile = await getPlatformSettings(ownerId); // Pass ownerId to getPlatformSettings
  
  const supabaseAdmin = await createSupabaseAdminClient();

  // Always ensure public.users entry exists and its role is platform_owner using the atomic utility
  console.log('[PlatformSettings] Ensuring public.users entry exists and role is platform_owner for user:', ownerId);
  const ensureResult = await ensureDbUser(ownerId, 'platform_owner');

  if (!ensureResult.success) {
    console.error('[PlatformSettings] Error ensuring public.users entry exists and role is platform_owner for user:', ensureResult.error);
    // Do not throw, continue with platform settings logic
  } else {
    console.log('[PlatformSettings] public.users entry ensured and role set to platform_owner for user:', ownerId);
  }

  if (existingProfile) { 
    console.log('[PlatformSettings] Existing platform settings found for owner:', ownerId);
    return serializeForClient(existingProfile);
  }

  console.log('[PlatformSettings] No existing platform settings, creating new for owner:', ownerId);

  // If no existing profile, create one
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
    onboarding_step: 1, // Initialize the step
  };

  // Insert platform settings
  const { data: newSettings, error: insertError } = await supabaseAdmin
    .from('platform_settings')
    .insert(defaultSettings)
    .select()
    .single();

  if (insertError) {
    console.error('[PlatformSettings] Error creating default platform settings:', insertError);
    throw insertError;
  }

  console.log('[PlatformSettings] Platform settings creation and role assignment completed for owner:', ownerId);

  // Revalidate paths to ensure fresh data is fetched on subsequent requests
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/');

  return serializeForClient(newSettings);
}

/**
 * Updates the platform settings for a given owner ID.
 */
export async function updatePlatformSettings(ownerId: string, updates: PlatformSettingsUpdate): Promise<PlatformSettings> {
  console.log('[PlatformSettings] updatePlatformSettings called for owner:', ownerId, 'with updates:', Object.keys(updates));
  
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .update(updates)
    .eq('owner_id', ownerId)
    .select()
    .single();

  if (error) {
    console.error('[PlatformSettings] Error updating platform settings:', error);
    throw error;
  }

  console.log('[PlatformSettings] Successfully updated platform settings for owner:', ownerId);

  // Revalidate paths after update
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/');

  return serializeForClient(data);
}