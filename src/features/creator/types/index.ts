import { GradientConfig, PatternConfig } from '@/utils/gradient-utils'; // Import GradientConfig and PatternConfig
import { ExtractedBrandingData, BillingAddress } from '@/features/creator-onboarding/types'; // Import ExtractedBrandingData and BillingAddress

export interface CreatorProfile {
  id: string;
  business_name: string | null;
  business_description: string | null;
  business_website: string | null;
  business_logo_url: string | null;
  stripe_account_id: string | null;
  stripe_account_enabled: boolean | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null; // Changed to allow null
  brand_color: string | null;
  brand_gradient?: GradientConfig | null; // JSON field for gradient config
  brand_pattern?: PatternConfig | null; // JSON field for pattern config
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
  stripe_access_token: string | null; // Added Stripe access token
  stripe_refresh_token: string | null; // Added Stripe refresh token
  branding_extracted_at: string | null;
  branding_extraction_error: string | null;
  branding_extraction_status: string | null;
  extracted_branding_data: ExtractedBrandingData | null; // Use specific interface
  // New billing fields
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: BillingAddress | null; // Use structured BillingAddress type
}

export interface CreatorProduct {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
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