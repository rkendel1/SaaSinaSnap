import Stripe from 'stripe';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import type { Database, Json } from '@/libs/supabase/types'; // Imported Json
import { GradientConfig, PatternConfig } from '@/utils/gradient-utils'; // Import GradientConfig and PatternConfig

export type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row'] & {
  brand_gradient?: GradientConfig | null; // JSON field for gradient config
  brand_pattern?: PatternConfig | null; // JSON field for pattern config
  extracted_branding_data?: ExtractedBrandingData | null; // JSON field for extracted branding data
  // New billing fields
  business_email?: string | null; // Added business_email
  business_website?: string | null; // Added business_website
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: BillingAddress | null; // JSONB type for structured address
  // New integration fields
  enabled_integrations?: string[] | null; // Array of enabled integration IDs
  webhook_endpoints?: WebhookEndpoint[] | null; // Array of webhook endpoints
  onboarding_completed_at?: string | null; // Timestamp when onboarding was completed
};
export type CreatorProfileInsert = Database['public']['Tables']['creator_profiles']['Insert'];
export type CreatorProfileUpdate = Database['public']['Tables']['creator_profiles']['Update'];

export type CreatorProduct = Database['public']['Tables']['creator_products']['Row'];
export type CreatorProductInsert = Database['public']['Tables']['creator_products']['Insert'];
export type CreatorProductUpdate = Database['public']['Tables']['creator_products']['Update'];

export type WhiteLabeledPage = Database['public']['Tables']['white_labeled_pages']['Row'];
export type WhiteLabeledPageInsert = Database['public']['Tables']['white_labeled_pages']['Insert'];
export type WhiteLabeledPageUpdate = Database['public']['Tables']['white_labeled_pages']['Update'];

export type CreatorWebhook = Database['public']['Tables']['creator_webhooks']['Row'];
export type CreatorWebhookInsert = Database['public']['Tables']['creator_webhooks']['Insert'];
export type CreatorWebhookUpdate = Database['public']['Tables']['creator_webhooks']['Update'];
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
  type: 'standard' | 'express' | 'custom' | 'none';
  business_profile?: {
    name: string | null;
    support_email: string | null;
    support_phone: string | null;
    support_url: string | null;
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
export type BillingInterval = 'day' | 'week' | 'month' | 'year'; // Define BillingInterval type

export interface ProductFormItem {
  id?: string; // Our DB product ID if already linked
  stripeProductId?: string; // Stripe's product ID
  stripePriceId?: string; // Stripe's price ID
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: ProductType;
  active: boolean; // Whether it's active in our store
  isExistingStripeProduct: boolean; // True if it came from Stripe API
  isLinkedToOurDb: boolean; // True if it's already in our creator_products table
  // New fields for subscription products
  billingInterval?: BillingInterval;
  trialPeriodDays?: number;
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
  voiceAndTone?: {
    tone: string;
    voice: string;
    confidence: number;
    keyPhrases: string[];
  };
  layoutPatterns?: { // Added layoutPatterns
    gridSystems: string[];
    spacingPatterns: string[];
    componentPatterns: string[];
  };
  interactionPatterns?: { // Added interactionPatterns
    hoverEffects: string[];
    transitions: string[];
    animations: string[];
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

// New type for billing address structure
export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Webhook endpoint type for integrations
export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
}

// Business type options for personalization
export interface BusinessTypeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}