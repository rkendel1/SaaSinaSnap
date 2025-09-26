'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

// Extend the Supabase generated type for white_labeled_pages to include specific config properties
export interface WhiteLabeledPage extends Tables<'white_labeled_pages'> {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
}

export async function getWhiteLabeledPage(creatorId: string, pageSlug: string): Promise<WhiteLabeledPage> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('white_labeled_pages')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('page_slug', pageSlug)
    .eq('active', true)
    .single();

  // Default configuration
  const defaultConfig: WhiteLabeledPage = {
    id: '', // Placeholder, will be overridden if data exists
    creator_id: creatorId,
    page_slug: pageSlug,
    page_title: null,
    page_description: null,
    page_config: null,
    custom_css: null,
    active: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tenant_id: null, // Default to null
    heroTitle: 'Welcome to SaaSinaSnap',
    heroSubtitle: 'SaaS in a Snap - Launch your business with amazing speed and efficiency',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  };

  if (error || !data) {
    return defaultConfig;
  }

  // At this point, 'data' is guaranteed to be a Database['public']['Tables']['white_labeled_pages']['Row']
  const fetchedPage = data;

  const pageConfigFromDb = (fetchedPage.page_config || {}) as Partial<WhiteLabeledPage>;

  const result: WhiteLabeledPage = {
    ...fetchedPage, // Spread the actual fetched data
    ...pageConfigFromDb, // Override with page_config properties
    // Ensure all required config properties are present, using defaultConfig as fallback
    heroTitle: pageConfigFromDb.heroTitle || defaultConfig.heroTitle,
    heroSubtitle: pageConfigFromDb.heroSubtitle || defaultConfig.heroSubtitle,
    ctaText: pageConfigFromDb.ctaText || defaultConfig.ctaText,
    showTestimonials: pageConfigFromDb.showTestimonials ?? defaultConfig.showTestimonials,
    showPricing: pageConfigFromDb.showPricing ?? defaultConfig.showPricing,
    showFaq: pageConfigFromDb.showFaq ?? defaultConfig.showFaq,
  };

  return result;
}