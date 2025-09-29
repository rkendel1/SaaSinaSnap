/**
 * COMPLETE DATABASE SCHEMA REBUILD
 * ================================
 * 
 * This migration performs a complete database schema rebuild by:
 * 1. Dropping all existing tables and their dependencies
 * 2. Recreating the entire schema with proper relationships
 * 3. Implementing comprehensive Row-Level Security (RLS) policies
 * 4. Adding all necessary indexes and constraints
 * 5. Setting up tenant management and utility functions
 * 
 * @version 1.0.0
 * @created 2025-01-09
 * @compatibility Supabase PostgreSQL 15+
 */

-- ============================================================================
-- SECTION 1: DROP ALL EXISTING STRUCTURES
-- ============================================================================

-- Drop all existing policies first to avoid dependency issues
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all RLS policies
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Drop all functions and triggers that might depend on tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS set_current_tenant(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS create_tenant(text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS ensure_tenant_context() CASCADE;
DROP FUNCTION IF EXISTS add_audit_log(text, text, text, jsonb, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all existing tables in dependency order
DROP TABLE IF EXISTS api_key_usage CASCADE;
DROP TABLE IF EXISTS api_key_rotations CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS generated_headers CASCADE;
DROP TABLE IF EXISTS site_analysis CASCADE;
DROP TABLE IF EXISTS asset_sharing_logs CASCADE;
DROP TABLE IF EXISTS embed_assets CASCADE;
DROP TABLE IF EXISTS connector_events CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS environment_sync_logs CASCADE;
DROP TABLE IF EXISTS product_environment_deployments CASCADE;
DROP TABLE IF EXISTS stripe_environment_configs CASCADE;
DROP TABLE IF EXISTS creator_api_key_configs CASCADE;
DROP TABLE IF EXISTS usage_billing_sync CASCADE;
DROP TABLE IF EXISTS usage_alerts CASCADE;
DROP TABLE IF EXISTS usage_aggregates CASCADE;
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS meter_plan_limits CASCADE;
DROP TABLE IF EXISTS usage_meters CASCADE;
DROP TABLE IF EXISTS tier_usage_overages CASCADE;
DROP TABLE IF EXISTS tier_analytics CASCADE;
DROP TABLE IF EXISTS customer_tier_assignments CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;
DROP TABLE IF EXISTS creator_analytics CASCADE;
DROP TABLE IF EXISTS creator_webhooks CASCADE;
DROP TABLE IF EXISTS white_labeled_pages CASCADE;
DROP TABLE IF EXISTS creator_products CASCADE;
DROP TABLE IF EXISTS creator_profiles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop storage policies and buckets
DROP POLICY IF EXISTS "Users can upload their own creator assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view creator assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own creator assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own creator assets" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'creator-assets';

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS pricing_type CASCADE;
DROP TYPE IF EXISTS pricing_plan_interval CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- Drop all indexes that might remain
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for indexes that don't exist or are dependencies
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: RECREATE CUSTOM TYPES
-- ============================================================================

-- User role enumeration
CREATE TYPE user_role AS ENUM ('platform_owner', 'creator', 'subscriber', 'user');

-- Pricing types for Stripe integration
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

-- Subscription status enumeration
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete', 
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

-- ============================================================================
-- SECTION 3: CORE TABLES - AUTHENTICATION AND USERS
-- ============================================================================

/**
 * USERS TABLE
 * Base user table extending Supabase auth.users
 */
CREATE TABLE users (
  -- UUID from auth.users
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  -- Customer's billing address in JSON format
  billing_address JSONB,
  -- Payment instruments
  payment_method JSONB,
  -- Multi-tenant support
  tenant_id UUID,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * CUSTOMERS TABLE
 * Private mapping of user IDs to Stripe customer IDs
 */
CREATE TABLE customers (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE
);

-- ============================================================================
-- SECTION 4: MULTI-TENANT ARCHITECTURE
-- ============================================================================

/**
 * TENANTS TABLE
 * Core multi-tenant support for platform isolation
 */
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint to users table
ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- ============================================================================
-- SECTION 5: STRIPE INTEGRATION TABLES
-- ============================================================================

/**
 * PRODUCTS TABLE
 * Stripe products synced via webhooks
 */
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB
);

/**
 * PRICES TABLE
 * Stripe prices synced via webhooks
 */
CREATE TABLE prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB
);

/**
 * SUBSCRIPTIONS TABLE
 * Stripe subscriptions synced via webhooks
 */
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  status subscription_status,
  metadata JSONB,
  price_id TEXT REFERENCES prices(id),
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  cancel_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  canceled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- SECTION 6: CREATOR SYSTEM TABLES
-- ============================================================================

/**
 * CREATOR PROFILES TABLE
 * Extended profiles for SaaS creators
 */
CREATE TABLE creator_profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  -- Business information
  business_name TEXT,
  business_description TEXT,
  business_website TEXT,
  business_logo_url TEXT,
  business_logo_file_path TEXT,
  uploaded_assets JSONB DEFAULT '{}'::jsonb,
  -- Stripe Connect integration
  stripe_account_id TEXT,
  stripe_account_enabled BOOLEAN DEFAULT false,
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  -- Branding and customization
  brand_color TEXT,
  custom_domain TEXT,
  branding_config JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * CREATOR PRODUCTS TABLE
 * Products managed by creators
 */
CREATE TABLE creator_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Product information
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT CHECK (char_length(currency) = 3) DEFAULT 'usd',
  -- Product configuration
  product_type TEXT CHECK (product_type IN ('one_time', 'subscription', 'usage_based')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  -- Environment management
  environment TEXT DEFAULT 'test' CHECK (environment IN ('test', 'production')),
  stripe_test_product_id TEXT,
  stripe_test_price_id TEXT,
  stripe_production_product_id TEXT,
  stripe_production_price_id TEXT,
  last_deployed_to_production TIMESTAMP WITH TIME ZONE,
  deployment_notes TEXT,
  -- Settings
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * CREATOR ANALYTICS TABLE
 * Analytics data for creators
 */
CREATE TABLE creator_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  dimensions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * CREATOR WEBHOOKS TABLE
 * Webhook configurations for creators
 */
CREATE TABLE creator_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 7: SUBSCRIPTION TIER MANAGEMENT
-- ============================================================================

/**
 * SUBSCRIPTION TIERS TABLE
 * Defines subscription plans/tiers for creators
 */
CREATE TABLE subscription_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Tier configuration
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT CHECK (char_length(currency) = 3) DEFAULT 'usd',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'daily')) DEFAULT 'monthly',
  -- Feature entitlements and usage caps
  feature_entitlements JSONB DEFAULT '[]'::jsonb,
  usage_caps JSONB DEFAULT '{}'::jsonb,
  -- Settings
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  -- Stripe integration
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  -- Trial settings
  trial_period_days INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(creator_id, name)
);

/**
 * CUSTOMER TIER ASSIGNMENTS TABLE
 * Maps customers to their subscription tiers
 */
CREATE TABLE customer_tier_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Assignment status
  active BOOLEAN DEFAULT true,
  -- Billing integration
  stripe_subscription_id TEXT,
  -- Period information
  period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE,
  -- Usage tracking
  current_usage JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(customer_id, tier_id, active) DEFERRABLE INITIALLY DEFERRED
);

/**
 * TIER ANALYTICS TABLE
 * Analytics for subscription tiers
 */
CREATE TABLE tier_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Metrics
  subscriber_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  churn_rate DECIMAL(5,4) DEFAULT 0,
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * TIER USAGE OVERAGES TABLE
 * Tracks usage overages for tier limits
 */
CREATE TABLE tier_usage_overages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES customer_tier_assignments(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Overage details
  metric_name TEXT NOT NULL,
  allowed_limit NUMERIC NOT NULL,
  actual_usage NUMERIC NOT NULL,
  overage_amount NUMERIC NOT NULL,
  -- Billing
  overage_rate DECIMAL(10,4),
  overage_cost DECIMAL(10,2),
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Status
  billed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 8: USAGE TRACKING AND METERING
-- ============================================================================

/**
 * USAGE METERS TABLE
 * Defines metered usage types
 */
CREATE TABLE usage_meters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  -- Meter configuration
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  -- Aggregation settings
  aggregation_type TEXT NOT NULL CHECK (aggregation_type IN ('sum', 'max', 'unique_count')) DEFAULT 'sum',
  value_key TEXT,
  -- Settings
  active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(tenant_id, name)
);

/**
 * METER PLAN LIMITS TABLE
 * Usage limits for meters per subscription tier
 */
CREATE TABLE meter_plan_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID REFERENCES usage_meters(id) NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Limit configuration
  hard_limit NUMERIC,
  soft_limit NUMERIC,
  overage_rate DECIMAL(10,4),
  -- Settings
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(meter_id, tier_id)
);

/**
 * USAGE EVENTS TABLE
 * Raw usage events for metering
 */
CREATE TABLE usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  meter_id UUID REFERENCES usage_meters(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  -- Event details
  event_value NUMERIC NOT NULL DEFAULT 1,
  event_data JSONB DEFAULT '{}'::jsonb,
  -- Identification
  idempotency_key TEXT,
  external_id TEXT,
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(tenant_id, meter_id, idempotency_key)
);

/**
 * USAGE AGGREGATES TABLE
 * Pre-computed usage aggregates for performance
 */
CREATE TABLE usage_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  meter_id UUID REFERENCES usage_meters(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  -- Aggregated values
  total_usage NUMERIC NOT NULL DEFAULT 0,
  unique_count INTEGER DEFAULT 0,
  max_value NUMERIC DEFAULT 0,
  -- Time period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month', 'year')),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(tenant_id, meter_id, customer_id, period_start, period_type)
);

/**
 * USAGE ALERTS TABLE
 * Usage threshold alerts
 */
CREATE TABLE usage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  meter_id UUID REFERENCES usage_meters(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  -- Alert configuration
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('percentage', 'absolute')),
  threshold_value NUMERIC NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('email', 'webhook', 'in_app')),
  -- Status
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Settings
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * USAGE BILLING SYNC TABLE
 * Tracks sync status with billing systems
 */
CREATE TABLE usage_billing_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  -- Sync details
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_data JSONB NOT NULL,
  -- External system integration
  stripe_usage_record_id TEXT,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  -- Timestamps
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 9: WHITE-LABELED PAGES AND BRANDING
-- ============================================================================

/**
 * WHITE LABELED PAGES TABLE
 * Custom pages for creators
 */
CREATE TABLE white_labeled_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Page configuration
  page_slug TEXT NOT NULL,
  page_title TEXT,
  page_description TEXT,
  -- Content and styling
  page_config JSONB DEFAULT '{}'::jsonb,
  custom_css TEXT,
  -- Settings
  active BOOLEAN DEFAULT true,
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(creator_id, page_slug)
);

-- ============================================================================
-- SECTION 10: EMBED ASSETS AND SHARING
-- ============================================================================

/**
 * EMBED ASSETS TABLE
 * Embeddable assets for creators
 */
CREATE TABLE embed_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Asset details
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('widget', 'button', 'banner', 'popup')),
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  styling JSONB DEFAULT '{}'::jsonb,
  -- Code generation
  embed_code TEXT,
  -- Settings
  active BOOLEAN DEFAULT true,
  public BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * ASSET SHARING LOGS TABLE
 * Tracks sharing and usage of embed assets
 */
CREATE TABLE asset_sharing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES embed_assets(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Sharing details
  shared_by UUID REFERENCES auth.users(id),
  shared_with TEXT, -- Email or identifier
  sharing_method TEXT CHECK (sharing_method IN ('email', 'link', 'embed')) DEFAULT 'link',
  -- Access tracking
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  -- Settings
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 11: API KEY MANAGEMENT
-- ============================================================================

/**
 * API KEYS TABLE
 * API key management for creators
 */
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Key details
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  -- Permissions and settings
  scopes TEXT[] DEFAULT '{}',
  rate_limit INTEGER,
  active BOOLEAN DEFAULT true,
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count BIGINT DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

/**
 * API KEY USAGE TABLE
 * Tracks API key usage
 */
CREATE TABLE api_key_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_status INTEGER,
  -- Metadata
  request_size INTEGER,
  response_size INTEGER,
  duration_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * API KEY ROTATIONS TABLE
 * Tracks API key rotation history
 */
CREATE TABLE api_key_rotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Rotation details
  old_key_hash TEXT NOT NULL,
  new_key_hash TEXT NOT NULL,
  rotation_reason TEXT,
  rotated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * CREATOR API KEY CONFIGS TABLE
 * API configuration per creator
 */
CREATE TABLE creator_api_key_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Configuration
  max_keys INTEGER DEFAULT 5,
  default_rate_limit INTEGER DEFAULT 1000,
  allowed_scopes TEXT[] DEFAULT '{}',
  require_ip_whitelist BOOLEAN DEFAULT false,
  ip_whitelist TEXT[],
  -- Settings
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(creator_id)
);

-- ============================================================================
-- SECTION 12: STRIPE ENVIRONMENT MANAGEMENT
-- ============================================================================

/**
 * STRIPE ENVIRONMENT CONFIGS TABLE
 * Stripe environment configurations per tenant
 */
CREATE TABLE stripe_environment_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('test', 'production')),
  -- Stripe configuration
  stripe_publishable_key TEXT,
  stripe_secret_key_encrypted TEXT,
  stripe_webhook_secret_encrypted TEXT,
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  sync_error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tenant_id, environment)
);

/**
 * PRODUCT ENVIRONMENT DEPLOYMENTS TABLE
 * Tracks product deployments between environments
 */
CREATE TABLE product_environment_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID NOT NULL,
  source_environment TEXT NOT NULL CHECK (source_environment IN ('test', 'production')),
  target_environment TEXT NOT NULL CHECK (target_environment IN ('test', 'production')),
  source_stripe_product_id TEXT,
  target_stripe_product_id TEXT,
  source_stripe_price_id TEXT,
  target_stripe_price_id TEXT,
  deployment_status TEXT DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deploying', 'completed', 'failed', 'rolled_back')),
  deployment_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * ENVIRONMENT SYNC LOGS TABLE
 * Tracks synchronization between environments
 */
CREATE TABLE environment_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('test', 'production')),
  operation TEXT NOT NULL CHECK (operation IN ('sync_products', 'sync_prices', 'sync_customers', 'full_sync')),
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  -- Sync details
  items_processed INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now') NOT NULL
);

-- ============================================================================
-- SECTION 13: FILE UPLOAD AND ANALYSIS
-- ============================================================================

/**
 * SITE ANALYSIS TABLE
 * Stores analysis of uploaded site files
 */
CREATE TABLE site_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- File details
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  -- Extraction results
  extracted_text TEXT,
  extracted_metadata JSONB DEFAULT '{}'::jsonb,
  brand_elements JSONB DEFAULT '{}'::jsonb,
  color_palette JSONB DEFAULT '{}'::jsonb,
  -- Analysis status
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * GENERATED HEADERS TABLE
 * AI-generated headers based on site analysis
 */
CREATE TABLE generated_headers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  site_analysis_id UUID REFERENCES site_analysis(id),
  tenant_id UUID REFERENCES tenants(id),
  -- Generated content
  header_html TEXT NOT NULL,
  header_css TEXT NOT NULL DEFAULT '',
  brand_alignment_score DECIMAL(3,2) CHECK (brand_alignment_score >= 0 AND brand_alignment_score <= 1),
  customizations JSONB NOT NULL DEFAULT '{}'::jsonb,
  white_label_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Settings
  active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 14: ANALYTICS AND EVENTS
-- ============================================================================

/**
 * ANALYTICS EVENTS TABLE
 * General analytics events
 */
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  -- Event details
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_properties JSONB DEFAULT '{}'::jsonb,
  -- Context
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now') NOT NULL
);

/**
 * CONNECTOR EVENTS TABLE
 * Events from external connectors
 */
CREATE TABLE connector_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  -- Connector details
  connector_type TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 15: PLATFORM SETTINGS AND AUDIT
-- ============================================================================

/**
 * PLATFORM SETTINGS TABLE
 * Global platform configuration
 */
CREATE TABLE platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Setting details
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
  -- Metadata
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  requires_restart BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/**
 * AUDIT LOGS TABLE
 * Comprehensive audit logging for compliance
 */
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  -- Change tracking
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SECTION 16: STORAGE CONFIGURATION
-- ============================================================================

-- Create storage bucket for creator assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-assets', 'creator-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 17: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON users FOR UPDATE USING (auth.uid() = id);

-- Customers table RLS (no policies - private table)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Tenants table RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform owners can manage tenants." ON tenants FOR ALL USING (true);

-- Products, Prices, Subscriptions RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subs data." ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Creator profiles RLS
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own creator profile." ON creator_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own creator profile." ON creator_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Can insert own creator profile." ON creator_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Tenant isolation for creator profiles." ON creator_profiles 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Creator products RLS
ALTER TABLE creator_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON creator_products FOR SELECT USING (active = true);
CREATE POLICY "Creators can manage their tenant products" ON creator_products
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

-- Creator analytics RLS
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for creator analytics." ON creator_analytics 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Creator webhooks RLS
ALTER TABLE creator_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own webhooks." ON creator_webhooks FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for creator webhooks." ON creator_webhooks 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Subscription tiers RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own tiers." ON subscription_tiers FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public can view active tiers." ON subscription_tiers FOR SELECT USING (active = true);
CREATE POLICY "Tenant isolation for subscription tiers." ON subscription_tiers 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Customer tier assignments RLS
ALTER TABLE customer_tier_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own assignments." ON customer_tier_assignments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Tenant isolation for customer tier assignments." ON customer_tier_assignments 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Tier analytics RLS
ALTER TABLE tier_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for tier analytics." ON tier_analytics 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Tier usage overages RLS
ALTER TABLE tier_usage_overages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for tier usage overages." ON tier_usage_overages 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Usage tracking RLS
ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage meters." ON usage_meters 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE meter_plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for meter plan limits." ON meter_plan_limits 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage events." ON usage_events 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE usage_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage aggregates." ON usage_aggregates 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage alerts." ON usage_alerts 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

ALTER TABLE usage_billing_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage billing sync." ON usage_billing_sync 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- White labeled pages RLS
ALTER TABLE white_labeled_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active pages" ON white_labeled_pages FOR SELECT USING (active = true);
CREATE POLICY "Creators can manage their tenant pages" ON white_labeled_pages
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

-- Embed assets RLS
ALTER TABLE embed_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own assets." ON embed_assets FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public can view public assets." ON embed_assets FOR SELECT USING (public = true);
CREATE POLICY "Tenant isolation for embed assets." ON embed_assets 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Asset sharing logs RLS
ALTER TABLE asset_sharing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for asset sharing logs." ON asset_sharing_logs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- API keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their API keys." ON api_keys FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for API keys." ON api_keys 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- API key usage RLS
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for API key usage." ON api_key_usage 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- API key rotations RLS
ALTER TABLE api_key_rotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for API key rotations." ON api_key_rotations 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Creator API key configs RLS
ALTER TABLE creator_api_key_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own API configs." ON creator_api_key_configs FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for creator API key configs." ON creator_api_key_configs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Stripe environment configs RLS
ALTER TABLE stripe_environment_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for stripe environment configs." ON stripe_environment_configs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Product environment deployments RLS
ALTER TABLE product_environment_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for product environment deployments." ON product_environment_deployments 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Environment sync logs RLS
ALTER TABLE environment_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for environment sync logs." ON environment_sync_logs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Site analysis RLS
ALTER TABLE site_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own site analysis." ON site_analysis FOR ALL USING (auth.uid() = creator_id);

-- Generated headers RLS
ALTER TABLE generated_headers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own generated headers." ON generated_headers FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public can view active generated headers." ON generated_headers FOR SELECT USING (active = true);

-- Analytics events RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for analytics events." ON analytics_events 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Connector events RLS
ALTER TABLE connector_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for connector events." ON connector_events 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Platform settings RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform owners can manage settings." ON platform_settings FOR ALL USING (true);

-- Audit logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for audit logs." ON audit_logs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Storage policies
CREATE POLICY "Users can upload their own creator assets"
ON storage.objects FOR insert
WITH CHECK (bucket_id = 'creator-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view creator assets"
ON storage.objects FOR select
USING (bucket_id = 'creator-assets');

CREATE POLICY "Users can update their own creator assets"
ON storage.objects FOR update
USING (bucket_id = 'creator-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own creator assets"
ON storage.objects FOR delete
USING (bucket_id = 'creator-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SECTION 18: INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- Tenants table indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_active ON tenants(active);

-- Creator profiles indexes
CREATE INDEX idx_creator_profiles_tenant_id ON creator_profiles(tenant_id);
CREATE INDEX idx_creator_profiles_custom_domain ON creator_profiles(custom_domain) WHERE custom_domain IS NOT NULL;

-- Creator products indexes
CREATE INDEX idx_creator_products_tenant_id ON creator_products(tenant_id);
CREATE INDEX idx_creator_products_creator_active ON creator_products(creator_id, active);
CREATE INDEX idx_creator_products_environment ON creator_products(environment);

-- Creator analytics indexes
CREATE INDEX idx_creator_analytics_creator_metric ON creator_analytics(creator_id, metric_name, period_start);

-- Subscription tiers indexes
CREATE INDEX idx_subscription_tiers_tenant_id ON subscription_tiers(tenant_id);
CREATE INDEX idx_subscription_tiers_creator_active ON subscription_tiers(creator_id, active);

-- Customer tier assignments indexes
CREATE INDEX idx_customer_tier_assignments_tenant_id ON customer_tier_assignments(tenant_id);
CREATE INDEX idx_customer_tier_assignments_customer ON customer_tier_assignments(customer_id, active);

-- Usage tracking indexes
CREATE INDEX idx_usage_events_tenant_meter ON usage_events(tenant_id, meter_id);
CREATE INDEX idx_usage_events_customer ON usage_events(customer_id, timestamp);
CREATE INDEX idx_usage_events_timestamp ON usage_events(timestamp DESC);
CREATE INDEX idx_usage_aggregates_tenant_customer ON usage_aggregates(tenant_id, customer_id, period_start);

-- White labeled pages indexes
CREATE INDEX idx_white_labeled_pages_creator_slug ON white_labeled_pages(creator_id, page_slug);

-- API keys indexes
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_creator ON api_keys(creator_id, active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- API key usage indexes
CREATE INDEX idx_api_key_usage_key_time ON api_key_usage(api_key_id, created_at);

-- Stripe environment indexes
CREATE INDEX idx_stripe_environment_configs_tenant_id ON stripe_environment_configs(tenant_id);
CREATE INDEX idx_stripe_environment_configs_environment ON stripe_environment_configs(tenant_id, environment);
CREATE INDEX idx_product_environment_deployments_tenant_id ON product_environment_deployments(tenant_id);
CREATE INDEX idx_environment_sync_logs_tenant_id ON environment_sync_logs(tenant_id);
CREATE INDEX idx_environment_sync_logs_created_at ON environment_sync_logs(created_at DESC);

-- File analysis indexes
CREATE INDEX idx_site_analysis_creator_id ON site_analysis(creator_id);
CREATE INDEX idx_site_analysis_status ON site_analysis(extraction_status);
CREATE INDEX idx_generated_headers_creator_id ON generated_headers(creator_id);
CREATE INDEX idx_generated_headers_active ON generated_headers(active);

-- Analytics indexes
CREATE INDEX idx_analytics_events_tenant_name ON analytics_events(tenant_id, event_name);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- SECTION 19: UTILITY FUNCTIONS
-- ============================================================================

-- Trigger to automatically create user entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set tenant context for current session
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant', true)::uuid;
EXCEPTION 
  WHEN others THEN
    RETURN null;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure tenant context is set
CREATE OR REPLACE FUNCTION ensure_tenant_context()
RETURNS UUID AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  tenant_uuid := get_current_tenant();
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Tenant context not set. Call set_current_tenant() first.';
  END IF;
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a new tenant (for platform owners)
CREATE OR REPLACE FUNCTION create_tenant(
  tenant_name TEXT,
  tenant_subdomain TEXT DEFAULT NULL,
  tenant_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  INSERT INTO tenants (name, subdomain, settings)
  VALUES (tenant_name, tenant_subdomain, tenant_settings)
  RETURNING id INTO new_tenant_id;
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add audit log entries
CREATE OR REPLACE FUNCTION add_audit_log(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_current_tenant();
  
  INSERT INTO audit_logs (
    tenant_id, user_id, action, resource_type, resource_id,
    old_value, new_value, metadata
  )
  VALUES (
    current_tenant_id, auth.uid(), p_action, p_resource_type, p_resource_id,
    p_old_value, p_new_value, p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_products_updated_at
  BEFORE UPDATE ON creator_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_tier_assignments_updated_at
  BEFORE UPDATE ON customer_tier_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_meters_updated_at
  BEFORE UPDATE ON usage_meters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_aggregates_updated_at
  BEFORE UPDATE ON usage_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_labeled_pages_updated_at
  BEFORE UPDATE ON white_labeled_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embed_assets_updated_at
  BEFORE UPDATE ON embed_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_api_key_configs_updated_at
  BEFORE UPDATE ON creator_api_key_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_environment_configs_updated_at
  BEFORE UPDATE ON stripe_environment_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_environment_deployments_updated_at
  BEFORE UPDATE ON product_environment_deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_analysis_updated_at
  BEFORE UPDATE ON site_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_headers_updated_at
  BEFORE UPDATE ON generated_headers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 20: REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Configure realtime for public tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  products, 
  prices, 
  tenants, 
  audit_logs, 
  usage_events;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log the completion of this migration
SELECT 'Complete database schema rebuild completed successfully!' as status;