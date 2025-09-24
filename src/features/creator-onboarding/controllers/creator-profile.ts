import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { CreatorProfile, CreatorProfileInsert, CreatorProfileUpdate } from '../types';

export async function getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  const { data, error } = await supabaseAdminClient
    .from('creator_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function createCreatorProfile(profile: CreatorProfileInsert): Promise<CreatorProfile> {
  const { data, error } = await supabaseAdminClient
    .from('creator_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCreatorProfile(userId: string, updates: CreatorProfileUpdate): Promise<CreatorProfile> {
  const { data, error } = await supabaseAdminClient
    .from('creator_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrCreateCreatorProfile(userId: string): Promise<CreatorProfile> {
  const existingProfile = await getCreatorProfile(userId);
  
  if (existingProfile) {
    return existingProfile;
  }

  return createCreatorProfile({
    id: userId,
    onboarding_completed: false,
    onboarding_step: 1,
    stripe_account_enabled: false,
  });
}