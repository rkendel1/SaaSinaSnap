"use server";

import { revalidatePath } from 'next/cache';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

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
  return data;
}

/**
 * Retrieves the platform settings for the given owner ID.
 * If no settings exist, it creates a new default entry.
 */
export async function getOrCreatePlatformSettings(ownerId: string): Promise<PlatformSettings> {
  console.log('[PlatformSettings] getOrCreatePlatformSettings called for owner:', ownerId);
  
  let existingProfile = await getPlatformSettings(ownerId); // Pass ownerId to getPlatformSettings
  
  if (existingProfile) { // No need for ownerId check here, as getPlatformSettings already filters
    console.log('[PlatformSettings] Existing platform settings found for owner:', ownerId);
    
    // Even if settings exist, ensure public.users role is correct
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error: publicUsersUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'platform_owner' })
      .eq('id', ownerId);

    if (publicUsersUpdateError) {
      console.error('[PlatformSettings] Error ensuring public.users role is platform_owner:', publicUsersUpdateError);
    } else {
      console.log('[PlatformSettings] Ensured public.users role is platform_owner for existing owner:', ownerId);
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(ownerId, {
      user_metadata: { role: 'platform_owner' },
    });

    if (authUpdateError) {
      console.error('[PlatformSettings] Error ensuring auth.users metadata role is platform_owner:', authUpdateError);
    } else {
      console.log('[PlatformSettings] Ensured auth.users metadata role is platform_owner for existing owner:', ownerId);
    }

    return existingProfile;
  }

  console.log('[PlatformSettings] No existing platform settings, creating new for owner:', ownerId);

  // If no existing profile, create one
  const defaultSettings: PlatformSettingsInsert = {
    owner_id: ownerId,
    platform_owner_onboarding_completed: false,
    onboarding_step: 1, // Initialize the step
  };

  const supabaseAdmin = await createSupabaseAdminClient();
  
  // IMPORTANT: Ensure an entry exists in public.users before attempting to update its role.
  // This handles cases where a user authenticates but no corresponding public.users entry is created by a trigger.
  console.log('[PlatformSettings] Ensuring public.users entry exists for user:', ownerId);
  const { error: upsertUserError } = await supabaseAdmin
    .from('users')
    .upsert({ id: ownerId, role: 'platform_owner' }, { onConflict: 'id' }); // Explicitly set role to platform_owner here

  if (upsertUserError) {
    console.error('[PlatformSettings] Error ensuring public.users entry exists:', upsertUserError);
    // Do not throw, continue with platform settings creation
  } else {
    console.log('[PlatformSettings] public.users entry ensured and role set to platform_owner for user:', ownerId);
  }

  // Step 1: Insert platform settings
  const { data: newSettings, error: insertError } = await supabaseAdmin
    .from('platform_settings')
    .insert(defaultSettings)
    .select()
    .single();

  if (insertError) {
    console.error('[PlatformSettings] Error creating default platform settings:', insertError);
    throw insertError;
  }

  console.log('[PlatformSettings] Platform settings created successfully, now updating user metadata role');

  // Step 2: Update the user_metadata in auth.users to ensure the role is immediately available in the session
  // IMPORTANT: Await this to ensure it completes atomically
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(ownerId, {
    user_metadata: { role: 'platform_owner' },
  });

  if (authUpdateError) {
    console.error('[PlatformSettings] Error updating auth.users user_metadata:', authUpdateError);
    // Don't throw, as the public.users update might still be successful
  } else {
    console.log('[PlatformSettings] Successfully updated auth.users user_metadata');
  }

  // Revalidate paths to ensure fresh data is fetched on subsequent requests
  revalidatePath('/platform-owner-onboarding');
  revalidatePath('/dashboard');
  revalidatePath('/');

  console.log('[PlatformSettings] Platform settings creation and role assignment completed for owner:', ownerId);

  return newSettings;
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

  return data;
}