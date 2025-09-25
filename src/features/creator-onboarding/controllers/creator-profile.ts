'use server';

import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/get-platform-settings';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { Json } from '@/libs/supabase/types';
import { getBestPaletteFromExtractedData } from '@/utils/color-palette-utils'; // Import the new utility
import { generateAutoGradient, type GradientConfig, type PatternConfig } from '@/utils/gradient-utils';

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

  return data as CreatorProfile | null; // Cast here
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

  // Set the user's role to 'creator' upon creation of creator profile
  await supabaseAdminClient
    .from('users')
    .update({ role: 'creator' })
    .eq('id', profile.id);

  return data as CreatorProfile; // Cast here
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

  return data as CreatorProfile; // Cast here
}

export async function getOrCreateCreatorProfile(userId: string): Promise<CreatorProfile> {
  let existingProfile = await getCreatorProfile(userId);
  
  if (existingProfile) {
    // If profile exists and branding extraction is completed, and no custom branding is set,
    // attempt to apply extracted branding.
    if (
      existingProfile.branding_extraction_status === 'completed' &&
      existingProfile.extracted_branding_data &&
      !existingProfile.brand_color // Check if brand_color is still default/not set
    ) {
      const bestPalette = getBestPaletteFromExtractedData(existingProfile.extracted_branding_data);
      if (bestPalette) {
        // Apply the extracted branding to the profile
        existingProfile = await updateCreatorProfile(userId, {
          brand_color: bestPalette.primary,
          brand_gradient: bestPalette.gradient as unknown as Json,
          brand_pattern: bestPalette.pattern as unknown as Json,
        });
      }
    }
    return existingProfile;
  }

  // If no existing profile, create one and apply default platform settings if available
  let defaultBrandColor = '#000000';
  let defaultGradient = generateAutoGradient(defaultBrandColor);
  let defaultPattern: PatternConfig = { type: 'none', intensity: 0.1, angle: 0 }; // Initialize with concrete numbers

  try {
    const platformSettings = await getPlatformSettings(); 
    if (platformSettings && platformSettings.platform_owner_onboarding_completed) {
      defaultBrandColor = platformSettings.default_creator_brand_color || defaultBrandColor;
      defaultGradient = (platformSettings.default_creator_gradient as unknown as GradientConfig) || defaultGradient; // Cast to unknown first
      
      const loadedPattern = (platformSettings.default_creator_pattern as unknown as PatternConfig); // Cast to unknown first
      if (loadedPattern) {
        defaultPattern = {
          type: loadedPattern.type || defaultPattern.type,
          intensity: loadedPattern.intensity ?? defaultPattern.intensity, // Use nullish coalescing
          angle: loadedPattern.angle ?? defaultPattern.angle, // Use nullish coalescing
        };
      }
    }
  } catch (error) {
    console.warn('Could not retrieve platform settings for default creator profile:', error);
  }

  return createCreatorProfile({
    id: userId,
    onboarding_completed: false,
    onboarding_step: 1,
    stripe_account_enabled: false, // Default to false, will be set to true after OAuth
    brand_color: defaultBrandColor,
    brand_gradient: defaultGradient as unknown as Json,
    brand_pattern: defaultPattern as unknown as Json,
    page_slug: userId, // Default page_slug to UUID
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

  const brandingData = profile.extracted_branding_data;
  
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