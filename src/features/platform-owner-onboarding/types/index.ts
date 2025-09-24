import type { Database } from '@/libs/supabase/types';
import type { GradientConfig, PatternConfig } from '@/utils/gradient-utils';

export type PlatformSettings = Database['public']['Tables']['platform_settings']['Row'];
export type PlatformSettingsInsert = Database['public']['Tables']['platform_settings']['Insert'];
export type PlatformSettingsUpdate = Database['public']['Tables']['platform_settings']['Update'];

export interface PlatformOnboardingStep {
  id: number;
  title: string;
  description: string;
  component: string;
  completed: boolean;
}

export interface DefaultCreatorBranding {
  brandColor: string;
  brandGradient: GradientConfig;
  brandPattern: PatternConfig;
}

export interface DefaultWhiteLabeledPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
}