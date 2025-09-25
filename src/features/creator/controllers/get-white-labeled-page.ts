'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { WhiteLabeledPage } from '../types';

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
  const fetchedPage = data as WhiteLabeledPage;

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