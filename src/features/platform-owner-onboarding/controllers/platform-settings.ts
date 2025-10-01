'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { PlatformSettings, PlatformSettingsInsert, PlatformSettingsUpdate } from '../types';

/**
 * Retrieves the platform settings for a given owner ID.
 */
export async function getPlatformSettings(ownerId: string): Promise<PlatformSettings | null> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('*')
    .eq('owner_id', ownerId) // Filter by owner_id
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
  let existingProfile = await getPlatformSettings(ownerId); // Pass ownerId to getPlatformSettings
  
  if (existingProfile) { // No need for ownerId check here, as getPlatformSettings already filters
    return existingProfile;
  }

  // If no existing profile, create one
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
    onboarding_step: 1, // Initialize the step
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

  // Set the user's role to 'platform_owner' in public.users
  await supabaseAdmin
    .from('users')
    .update({ role: 'platform_owner' })
    .eq('id', ownerId);

  // IMPORTANT: Also update the user_metadata in auth.users to ensure the role is immediately available in the session
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(ownerId, {
    user_metadata: { role: 'platform_owner' },
  });

  if (authUpdateError) {
    console.error('Error updating auth.users user_metadata:', authUpdateError);
    // Don't throw, as the public.users update might still be successful
  }

  // Revalidate paths to ensure fresh data is fetched on subsequent requests
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/');

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

  // Revalidate paths after update
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/');

  return data;
}