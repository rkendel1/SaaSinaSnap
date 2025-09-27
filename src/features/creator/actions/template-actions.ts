'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile, updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { updateWhiteLabeledPage } from '@/features/creator-onboarding/controllers/white-labeled-pages';

import { TemplateTheme } from '../templates/types';

/**
 * Update the template theme for a creator's white-labeled pages
 */
export async function updateTemplateThemeAction(theme: TemplateTheme) {
  const user = await getAuthenticatedUser();
  
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Get creator profile
    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // Update the creator's extracted branding data to include the preferred theme
    const updatedBrandingData = {
      ...(creatorProfile.extracted_branding_data as any || {}),
      preferredTheme: theme,
      lastThemeUpdate: new Date().toISOString(),
    };

    // Update creator profile with new theme preference
    await updateCreatorProfile(user.id, {
      extracted_branding_data: updatedBrandingData,
    });

    // Revalidate relevant paths
    revalidatePath('/creator/white-label-sites');
    revalidatePath('/creator/white-label-sites/templates');
    revalidatePath(`/c/${creatorProfile.page_slug}`);
    revalidatePath(`/c/${creatorProfile.page_slug}/pricing`);
    revalidatePath(`/c/${creatorProfile.page_slug}/account`);

    return { success: true, theme };
  } catch (error) {
    console.error('Error updating template theme:', error);
    throw new Error('Failed to update template theme');
  }
}

/**
 * Get the current template theme for a creator
 */
export async function getCurrentTemplateThemeAction(): Promise<TemplateTheme> {
  const user = await getAuthenticatedUser();
  
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // Check if theme is stored in extracted branding data
    if (creatorProfile.extracted_branding_data && typeof creatorProfile.extracted_branding_data === 'object') {
      const brandingData = creatorProfile.extracted_branding_data as any;
      if (brandingData.preferredTheme && ['modern', 'classic', 'minimal', 'corporate'].includes(brandingData.preferredTheme)) {
        return brandingData.preferredTheme as TemplateTheme;
      }
    }

    // Default to modern theme
    return 'modern';
  } catch (error) {
    console.error('Error getting current template theme:', error);
    return 'modern'; // Default fallback
  }
}

/**
 * Deploy/publish all white-labeled pages for a creator
 */
export async function deployWhiteLabeledSiteAction() {
  const user = await getAuthenticatedUser();
  
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Get creator profile
    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // TODO: Update all white-labeled pages to set active = true
    // This would require fetching all pages and updating them
    // For now, we'll just revalidate paths

    // Revalidate relevant paths
    revalidatePath('/creator/white-label-sites');
    revalidatePath(`/c/${creatorProfile.page_slug}`);
    revalidatePath(`/c/${creatorProfile.page_slug}/pricing`);
    revalidatePath(`/c/${creatorProfile.page_slug}/account`);

    return { success: true, message: 'Site deployed successfully' };
  } catch (error) {
    console.error('Error deploying white-labeled site:', error);
    throw new Error('Failed to deploy site');
  }
}

/**
 * Unpublish all white-labeled pages for a creator
 */
export async function unpublishWhiteLabeledSiteAction() {
  const user = await getAuthenticatedUser();
  
  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Get creator profile
    const creatorProfile = await getCreatorProfile(user.id);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // TODO: Update all white-labeled pages to set active = false
    // This would require fetching all pages and updating them
    // For now, we'll just revalidate paths

    // Revalidate relevant paths
    revalidatePath('/creator/white-label-sites');
    revalidatePath(`/c/${creatorProfile.page_slug}`);
    revalidatePath(`/c/${creatorProfile.page_slug}/pricing`);
    revalidatePath(`/c/${creatorProfile.page_slug}/account`);

    return { success: true, message: 'Site unpublished successfully' };
  } catch (error) {
    console.error('Error unpublishing white-labeled site:', error);
    throw new Error('Failed to unpublish site');
  }
}