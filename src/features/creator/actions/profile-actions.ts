'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

/**
 * Updates the creator's page slug (custom domain/subdomain) in their profile.
 */
export async function updateCreatorPageSlugAction(newSlug: string) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // Basic validation for the slug
  const cleanedSlug = newSlug.trim().toLowerCase();
  if (!cleanedSlug) {
    throw new Error('Page slug cannot be empty.');
  }
  // Further validation (e.g., no special characters, length) could be added here.

  const updatedProfile = await updateCreatorProfile(user.id, {
    page_slug: cleanedSlug,
  });

  // Revalidate paths related to the old and new slug
  revalidatePath(`/c/${user.id}`); // Old default slug
  revalidatePath(`/c/${cleanedSlug}`); // New slug
  revalidatePath('/creator/profile'); // Profile page itself
  revalidatePath('/creator/dashboard'); // Dashboard might show the link

  return updatedProfile;
}