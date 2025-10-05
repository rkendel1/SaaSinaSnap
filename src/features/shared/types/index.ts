/**
 * Shared Type Definitions
 * 
 * This file contains centralized type definitions used across the application.
 * Previously, these types were duplicated in multiple locations:
 * - src/features/creator-onboarding/types/index.ts
 * - src/features/creator/types/index.ts
 * 
 * Consolidating them here ensures consistency and reduces maintenance overhead.
 */

import type { Database, Json } from '@/libs/supabase/types';
import { GradientConfig, PatternConfig } from '@/utils/gradient-utils';

// Re-export supporting types from creator-onboarding
export type {
  BillingAddress,
  ExtractedBrandingData,
  WebhookEndpoint,
  BrandingExtractionStatus,
  BrandingExtractionResult,
  ProductType,
  BillingInterval,
} from '@/features/creator-onboarding/types';

/**
 * CreatorProfile Type
 * 
 * Represents a creator's profile in the system, extending the database schema
 * with additional typed fields for JSON columns.
 * 
 * This type is the single source of truth for creator profiles across the application.
 * It extends the database Row type and adds:
 * - Typed JSON fields (brand_gradient, brand_pattern, extracted_branding_data)
 * - Billing information fields (business_email, billing_email, billing_phone, billing_address)
 * - Integration settings (enabled_integrations, webhook_endpoints)
 * - Stripe access tokens (may not be persisted in DB for security)
 * 
 * Note: The database schema already includes most fields. The extensions here are:
 * 1. Typed JSON columns (converted from Json type to specific interfaces)
 * 2. Additional fields not in database (business_email, billing_*, enabled_integrations, webhook_endpoints, stripe_*_token)
 */
export type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row'] & {
  // Typed JSON fields (these override the Json type from the database)
  brand_gradient?: GradientConfig | null;
  brand_pattern?: PatternConfig | null;
  extracted_branding_data?: ExtractedBrandingData | null;
  
  // Additional billing fields not in database schema
  business_email?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: BillingAddress | null;
  
  // Additional integration fields not in database schema
  enabled_integrations?: string[] | null;
  webhook_endpoints?: WebhookEndpoint[] | null;
  
  // Stripe access tokens (may not be persisted in DB for security)
  stripe_access_token?: string | null;
  stripe_refresh_token?: string | null;
};

/**
 * CreatorProfileInsert Type
 * 
 * Type for inserting new creator profiles into the database.
 * Extends the database Insert type from Supabase.
 */
export type CreatorProfileInsert = Database['public']['Tables']['creator_profiles']['Insert'];

/**
 * CreatorProfileUpdate Type
 * 
 * Type for updating existing creator profiles in the database.
 * Extends the database Update type from Supabase.
 */
export type CreatorProfileUpdate = Database['public']['Tables']['creator_profiles']['Update'];

/**
 * CreatorProduct Type
 * 
 * Represents a product created by a creator in the system.
 * Extends the database schema with additional fields for enhanced product features.
 * 
 * Previously duplicated in:
 * - src/features/creator-onboarding/types/index.ts (as type)
 * - src/features/creator/types/index.ts (as interface)
 * 
 * Note: Some fields like image_url and status are application-level extensions
 * not present in the database schema but used for display and logic purposes.
 */
export type CreatorProduct = Database['public']['Tables']['creator_products']['Row'] & {
  // Additional fields for enhanced product management
  // These are application-level extensions not in the database
  image_url?: string | null;
  status?: ProductStatus | string | null;
};

/**
 * CreatorProductInsert Type
 * 
 * Type for inserting new creator products into the database.
 */
export type CreatorProductInsert = Database['public']['Tables']['creator_products']['Insert'];

/**
 * CreatorProductUpdate Type
 * 
 * Type for updating existing creator products in the database.
 */
export type CreatorProductUpdate = Database['public']['Tables']['creator_products']['Update'];

/**
 * ProductStatus Type
 * 
 * Enhanced product status states used throughout the application.
 */
export type ProductStatus = 'active' | 'archived' | 'deleted' | 'draft';

/**
 * Type Imports from creator-onboarding
 * 
 * These types are defined in creator-onboarding/types and used here.
 * They are re-exported above for convenience.
 */
import type {
  BillingAddress,
  ExtractedBrandingData,
  WebhookEndpoint,
} from '@/features/creator-onboarding/types';
