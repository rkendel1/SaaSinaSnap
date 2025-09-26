'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

import { createWhiteLabeledPage, getWhiteLabeledPage, updateWhiteLabeledPage } from '../controllers/white-labeled-pages';
import type { WhiteLabeledPageInsert, WhiteLabeledPageUpdate } from '../types';

/**
 * Saves or updates AI-generated HTML content for a specific white-labeled page.
 */
export async function saveWhiteLabeledPageContentAction(
  creatorId: string,
  pageSlug: string,
  htmlContent: string,
  pageConfig: Record<string, any> = {},
  metaTitle?: string,
  metaDescription?: string,
  customCss?: string,
): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user?.id || user.id !== creatorId) {
    throw new Error('Not authenticated or unauthorized to save page content.');
  }

  const existingPage = await getWhiteLabeledPage(creatorId, pageSlug);

  const pageData: WhiteLabeledPageInsert | WhiteLabeledPageUpdate = {
    creator_id: creatorId,
    page_slug: pageSlug,
    page_title: metaTitle || `${pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1)} Page`,
    page_description: metaDescription,
    page_config: pageConfig,
    custom_css: customCss,
    active: true, // Mark as active when AI generates it
    meta_title: metaTitle,
    meta_description: metaDescription,
  };

  if (existingPage) {
    await updateWhiteLabeledPage(existingPage.id!, pageData);
  } else {
    await createWhiteLabeledPage(pageData as WhiteLabeledPageInsert);
  }

  revalidatePath(`/c/${creatorId}/${pageSlug}`);
  revalidatePath(`/c/${creatorId}`); // Revalidate main landing page if it's home
}