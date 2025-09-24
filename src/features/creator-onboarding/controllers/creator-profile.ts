import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { BackgroundExtractionService } from '../services/background-extraction';
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

  // Check if business_website was updated and trigger background extraction
  if (updates.business_website && BackgroundExtractionService.isExtractionSupported(updates.business_website)) {
    try {
      await BackgroundExtractionService.processCreatorURL(userId, updates.business_website);
    } catch (error) {
      console.error('Failed to start background extraction:', error);
      // Don't throw here - the profile update was successful
    }
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

/**
 * Get branding suggestions from extracted data
 */
export async function getBrandingSuggestions(userId: string): Promise<{
  suggestedColors: string[];
  suggestedFonts: string[];
  extractionStatus: string | null;
  extractionError: string | null;
} | null> {
  const profile = await getCreatorProfile(userId);
  
  if (!profile?.extracted_branding_data) {
    return {
      suggestedColors: [],
      suggestedFonts: [],
      extractionStatus: profile?.branding_extraction_status || null,
      extractionError: profile?.branding_extraction_error || null,
    };
  }

  const brandingData = profile.extracted_branding_data as any;
  
  return {
    suggestedColors: [
      ...(brandingData.primaryColors || []),
      ...(brandingData.secondaryColors || []).slice(0, 2)
    ],
    suggestedFonts: Object.values(brandingData.fonts || {}).filter(Boolean) as string[],
    extractionStatus: profile.branding_extraction_status,
    extractionError: profile.branding_extraction_error,
  };
}