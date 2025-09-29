import type { Database } from '@/libs/supabase/types';
import type { GradientConfig, PatternConfig } from '@/utils/gradient-utils';

export type PlatformSettings = Database['public']['Tables']['platform_settings']['Row'];
export type PlatformSettingsInsert = Database['public']['Tables']['platform_settings']['Insert'];
export type PlatformSettingsUpdate = Database['public']['Tables']['platform_settings']['Update'];

// Enhanced types for Stripe environment management
export type StripeEnvironment = 'test' | 'production';

export interface StripeEnvironmentConfig {
  id: string;
  environment: StripeEnvironment;
  stripe_account_id?: string;
  stripe_access_token?: string;
  stripe_refresh_token?: string;
  stripe_publishable_key?: string;
  is_active: boolean;
  webhook_endpoint_id?: string;
  webhook_secret?: string;
  last_synced_at?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  sync_error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductEnvironmentDeployment {
  id: string;
  product_id: string;
  source_environment: StripeEnvironment;
  target_environment: StripeEnvironment;
  source_stripe_product_id?: string;
  target_stripe_product_id?: string;
  source_stripe_price_id?: string;
  target_stripe_price_id?: string;
  deployment_status: 'pending' | 'scheduled' | 'deploying' | 'validating' | 'completed' | 'failed' | 'rolled_back' | 'cancelled';
  deployment_data: Record<string, any>;
  error_message?: string;
  deployed_by?: string;
  deployed_at?: string;
  scheduled_for?: string;
  validation_results?: ValidationResult[];
  progress_percentage?: number;
  progress_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, any>;
}

export interface DeploymentSchedule {
  id: string;
  product_id: string;
  scheduled_for: string;
  timezone: string;
  deployment_type: 'immediate' | 'scheduled';
  notification_settings: {
    email_notifications: boolean;
    webhook_notifications: boolean;
    reminder_before_minutes?: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentSyncLog {
  id: string;
  environment: StripeEnvironment;
  operation: string;
  entity_type?: string;
  entity_id?: string;
  operation_data: Record<string, any>;
  status: 'started' | 'completed' | 'failed';
  error_message?: string;
  started_by?: string;
  duration_ms?: number;
  created_at: string;
}

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