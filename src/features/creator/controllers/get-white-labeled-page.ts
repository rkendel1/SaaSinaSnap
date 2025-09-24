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

  if (error) {
    // If no specific page config found, return default config
    return defaultConfig;
  }

  // Parse the page_config JSON and merge with defaults
  const pageConfig = data?.page_config as Record<string, any> || {};
  
  return {
    ...defaultConfig,
    ...pageConfig,
    ...data,
  } as WhiteLabeledPage;
}