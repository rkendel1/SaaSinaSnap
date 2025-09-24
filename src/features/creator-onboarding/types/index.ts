import type { Database } from '@/libs/supabase/types';

export type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row'];
export type CreatorProfileInsert = Database['public']['Tables']['creator_profiles']['Insert'];
export type CreatorProfileUpdate = Database['public']['Tables']['creator_profiles']['Update'];

export type CreatorProduct = Database['public']['Tables']['creator_products']['Row'];
export type CreatorProductInsert = Database['public']['Tables']['creator_products']['Insert'];
export type CreatorProductUpdate = Database['public']['Tables']['creator_products']['Update'];

export type WhiteLabeledPage = Database['public']['Tables']['white_labeled_pages']['Row'];
export type WhiteLabeledPageInsert = Database['public']['Tables']['white_labeled_pages']['Insert'];
export type WhiteLabeledPageUpdate = Database['public']['Tables']['white_labeled_pages']['Update'];

export type CreatorWebhook = Database['public']['Tables']['creator_webhooks']['Row'];
export type CreatorAnalytics = Database['public']['Tables']['creator_analytics']['Row'];

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: string;
  completed: boolean;
}

export interface CreatorOnboardingData {
  profile: Partial<CreatorProfile>;
  products: CreatorProduct[];
  stripeConnectUrl?: string;
  currentStep: number;
  totalSteps: number;
}

export interface StripeConnectAccount {
  id: string;
  type: string;
  business_profile?: {
    name?: string;
    support_email?: string;
    support_phone?: string;
    support_url?: string;
    url?: string;
  };
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export type ProductType = 'one_time' | 'subscription' | 'usage_based';

export interface ProductImportItem {
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: ProductType;
  stripeProductId?: string;
  stripePriceId?: string;
}

// Branding extraction types
export interface ExtractedBrandingData {
  primaryColors: string[];
  secondaryColors: string[];
  fonts: {
    primary?: string;
    secondary?: string;
    headings?: string;
  };
  designTokens: {
    borderRadius?: string;
    spacing?: string;
    shadows?: string[];
  };
  styleElements: {
    gradients?: Array<{
      type: 'linear' | 'radial';
      colors: string[];
      direction?: number;
    }>;
    patterns?: Array<{
      type: string;
      description: string;
    }>;
  };
  metadata: {
    extractedAt: string;
    sourceUrl: string;
    confidence: number; // 0-1 score of extraction confidence
    elementsFound: string[]; // List of CSS selectors or elements analyzed
  };
}

export type BrandingExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BrandingExtractionResult {
  status: BrandingExtractionStatus;
  data?: ExtractedBrandingData;
  error?: string;
  processedAt?: string;
}