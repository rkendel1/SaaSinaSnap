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
    heroTitle: 'Welcome to Our Platform',
    heroSubtitle: 'Discover our amazing products and services',
    ctaText: 'Get Started',
    showTestimonials: true,
    showPricing: true,
    showFaq: true,
  };

  if (error || !data) {
    return defaultConfig;
  }

  // data is Database['public']['Tables']['white_labeled_pages']['Row'] here
  const pageConfigFromDb = (data.page_config || {}) as Partial<WhiteLabeledPage>;

  // Combine the database row with the properties from its page_config JSONB
  // and ensure all required fields from WhiteLabeledPage are present,
  // defaulting to defaultConfig values if not found.
  const result: WhiteLabeledPage = {
    // Start with the database row's properties
    ...data,
    // Override/add config properties from page_config JSONB
    ...pageConfigFromDb,
    // Ensure all required config properties are present, using defaultConfig as fallback
    heroTitle: pageConfigFromDb.heroTitle || defaultConfig.heroTitle,
    // Use nullish coalescing for boolean properties
    heroSubtitle: pageConfigFromDb.heroSubtitle || defaultConfig.heroSubtitle,
    ctaText: pageConfigFromDb.ctaText || defaultConfig.ctaText,
    showTestimonials: pageConfigFromDb.showTestimonials ?? defaultConfig.showTestimonials,
    showPricing: pageConfigFromDb.showPricing ?? defaultConfig.showPricing,
    showFaq: pageConfigFromDb.showFaq ?? defaultConfig.showFaq,
  };

  return result;
}