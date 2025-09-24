export interface CreatorProfile {
  id: string;
  business_name: string | null;
  business_description: string | null;
  business_website: string | null;
  business_logo_url: string | null;
  stripe_account_id: string | null;
  stripe_account_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  brand_color: string | null;
  brand_gradient?: any; // JSON field for gradient config
  brand_pattern?: any; // JSON field for pattern config
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorProduct {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  product_type: 'one_time' | 'subscription' | 'usage_based';
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  active: boolean;
  featured: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface WhiteLabeledPage {
  id?: string;
  creator_id?: string;
  page_slug?: string;
  page_title?: string | null;
  page_description?: string | null;
  page_config?: Record<string, any> | null;
  custom_css?: string | null;
  active?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
  updated_at?: string;
  // Config properties
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
}