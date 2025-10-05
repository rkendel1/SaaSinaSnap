import { BillingAddress,ExtractedBrandingData } from '@/features/creator-onboarding/types'; // Import ExtractedBrandingData and BillingAddress
import { Json, Tables } from '@/libs/supabase/types'; // Import Json type
import { GradientConfig, PatternConfig } from '@/utils/gradient-utils'; // Import GradientConfig and PatternConfig

export * from './embed-assets';

// Re-export centralized types from shared directory
// These types are now defined in @/features/shared/types for consistency across the application
export type {
  CreatorProfile,
  CreatorProduct,
  ProductStatus,
} from '@/features/shared/types';

// Enhanced product data interface supporting full Stripe capabilities
export interface EnhancedProductData {
  id?: string;
  name: string;
  description?: string;
  images?: string[]; // Support multiple images
  price: number;
  currency: string;
  product_type: 'one_time' | 'subscription' | 'usage_based';
  active: boolean;
  metadata?: Record<string, string>; // Custom metadata for products
  
  // Pricing tiers and options
  pricing_tiers?: PricingTier[];
  
  // Subscription-specific options
  billing_interval?: 'month' | 'year' | 'week' | 'day';
  billing_interval_count?: number;
  trial_period_days?: number;
  
  // Usage-based pricing options
  usage_type?: 'metered' | 'licensed';
  aggregate_usage?: 'sum' | 'last_during_period' | 'last_ever' | 'max';
  
  // SEO and categorization
  statement_descriptor?: string;
  unit_label?: string;
  
  // Features and capabilities
  features?: string[];
  category?: string;
  tags?: string[];
  
  // Archival and deletion info
  archived_at?: string;
  archived_reason?: string;
  deleted_at?: string;
  deletion_reason?: string;
}

export interface PricingTier {
  id?: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year' | 'week' | 'day';
  interval_count?: number;
  up_to?: number; // For usage-based pricing
  flat_amount?: number; // Flat fee component
  unit_amount?: number; // Per-unit fee
}

// Product management actions
export type ProductAction = 'create' | 'update' | 'archive' | 'delete' | 'duplicate';

// Filter and search options
export interface ProductFilters {
  status?: ProductStatus[];
  product_type?: string[];
  category?: string;
  tags?: string[];
  price_range?: {
    min?: number;
    max?: number;
  };
  created_after?: string;
  created_before?: string;
}

export interface ProductSearchOptions {
  query?: string;
  filters?: ProductFilters;
  sort_by?: 'name' | 'price' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Updated WhiteLabeledPage interface to align with DB and controller
export interface WhiteLabeledPage extends Tables<'white_labeled_pages'> {
  // Explicitly define common config properties for easier access
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  ctaText?: string | null;
  showTestimonials?: boolean | null;
  showPricing?: boolean | null;
  showFaq?: boolean | null;
  // Add other specific config properties if needed
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
}

export interface SubscribedProduct {
  id: string;
  subscription_id: string;
  creator_product_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  product_type: string | null;
  image_url: string | null;
  features: Json | null;
  metadata: Json | null;
  subscribed_at: string;
}