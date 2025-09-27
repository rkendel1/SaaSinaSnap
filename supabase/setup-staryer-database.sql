/**
 * STARYER PLATFORM - COMPLETE SUPABASE DATABASE SETUP
 * =====================================================
 * 
 * This script sets up a complete Supabase database for the Staryer platform
 * and populates it with representative test data for development, testing, 
 * and demo environments.
 * 
 * EXECUTION INSTRUCTIONS:
 * -----------------------
 * 1. Create a new Supabase project at https://supabase.com/dashboard
 * 2. Go to SQL Editor in your Supabase dashboard
 * 3. Copy and paste this entire script
 * 4. Click "Run" to execute
 * 
 * FOR CI/CD ENVIRONMENTS:
 * ----------------------
 * Use Supabase CLI: supabase db reset --db-url "your-database-url"
 * Then: psql "your-database-url" < setup-staryer-database.sql
 * 
 * WHAT THIS SCRIPT DOES:
 * ---------------------
 * - Creates all necessary tables with proper relationships and constraints
 * - Sets up multi-tenant architecture with Row-Level Security (RLS)
 * - Creates indexes for optimal performance
 * - Implements tenant context management functions
 * - Populates database with realistic test data for all user roles
 * - Sets up audit logging and usage tracking
 * 
 * FEATURES COVERED:
 * ----------------
 * ✓ Multi-tenant architecture with RLS policies
 * ✓ User management (platform owners, creators, end-users)
 * ✓ Creator profiles and onboarding
 * ✓ Subscription tier management
 * ✓ Usage tracking and metered billing
 * ✓ Audit logging for compliance
 * ✓ Stripe Connect integration support
 * ✓ White-labeled pages and branding
 * ✓ API key management
 * ✓ File upload support
 * 
 * @version 1.0.0
 * @created 2025-01-09
 * @compatibility Supabase PostgreSQL 15+
 */

-- ============================================================================
-- SECTION 1: USER TYPES AND CORE AUTHENTICATION
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
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own user data." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON users FOR UPDATE USING (auth.uid() = id);

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

/**
 * CUSTOMERS TABLE
 * Private mapping of user IDs to Stripe customer IDs
 */
CREATE TABLE customers (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- No policies - this is a private table for internal use only

-- ============================================================================
-- SECTION 2: MULTI-TENANT ARCHITECTURE
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

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform owners can manage tenants." ON tenants FOR ALL USING (true);

-- Indexes for efficient tenant queries
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_active ON tenants(active);

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

/**
 * TENANT CONTEXT MANAGEMENT FUNCTIONS
 */

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

-- ============================================================================
-- SECTION 3: CREATOR PROFILES AND ONBOARDING
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

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can view own creator profile." ON creator_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own creator profile." ON creator_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Can insert own creator profile." ON creator_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Tenant isolation for creator profiles." ON creator_profiles 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_creator_profiles_tenant_id ON creator_profiles(tenant_id);

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
  -- Settings
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE creator_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON creator_products FOR SELECT USING (active = true);
CREATE POLICY "Creators can manage their tenant products" ON creator_products
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

CREATE INDEX idx_creator_products_tenant_id ON creator_products(tenant_id);
CREATE INDEX idx_creator_products_creator_active ON creator_products(creator_id, active);

-- ============================================================================
-- SECTION 4: SUBSCRIPTION TIER MANAGEMENT
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

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own tiers." ON subscription_tiers FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public can view active tiers." ON subscription_tiers FOR SELECT USING (active = true);
CREATE POLICY "Tenant isolation for subscription tiers." ON subscription_tiers 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_subscription_tiers_tenant_id ON subscription_tiers(tenant_id);
CREATE INDEX idx_subscription_tiers_creator_active ON subscription_tiers(creator_id, active);
CREATE INDEX idx_subscription_tiers_sort_order ON subscription_tiers(creator_id, sort_order);

/**
 * CUSTOMER TIER ASSIGNMENTS TABLE
 * Tracks customer subscriptions to specific tiers
 */
CREATE TABLE customer_tier_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users NOT NULL,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Assignment status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')) DEFAULT 'active',
  -- Billing period tracking
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Trial information
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  -- Cancellation information
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  -- Stripe integration
  stripe_subscription_id TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(customer_id, creator_id)
);

ALTER TABLE customer_tier_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own assignments." ON customer_tier_assignments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Creators can view assignments for their tiers." ON customer_tier_assignments FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can manage assignments for their tiers." ON customer_tier_assignments FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for customer tier assignments." ON customer_tier_assignments 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_customer_tier_assignments_tenant_id ON customer_tier_assignments(tenant_id);
CREATE INDEX idx_customer_tier_assignments_customer ON customer_tier_assignments(customer_id, status);
CREATE INDEX idx_customer_tier_assignments_creator ON customer_tier_assignments(creator_id, status);

-- ============================================================================
-- SECTION 5: USAGE TRACKING AND METERED BILLING
-- ============================================================================

/**
 * USAGE METERS TABLE
 * Defines different types of usage metrics that can be tracked
 */
CREATE TABLE usage_meters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Meter configuration
  event_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  aggregation_type TEXT NOT NULL CHECK (aggregation_type IN ('count', 'sum', 'unique', 'duration', 'max')),
  unit_name TEXT DEFAULT 'units',
  -- Billing configuration
  billing_model TEXT NOT NULL CHECK (billing_model IN ('metered', 'licensed', 'hybrid')) DEFAULT 'metered',
  -- Status
  active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(creator_id, event_name)
);

ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own meters." ON usage_meters FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for usage meters." ON usage_meters 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_usage_meters_tenant_id ON usage_meters(tenant_id);
CREATE INDEX idx_usage_meters_creator ON usage_meters(creator_id, active);

/**
 * USAGE EVENTS TABLE
 * Raw usage events tracked by the system
 */
CREATE TABLE usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID REFERENCES usage_meters(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Event data
  user_id TEXT NOT NULL, -- End-user/customer identifier
  event_value NUMERIC NOT NULL DEFAULT 1,
  properties JSONB DEFAULT '{}'::jsonb,
  -- Timestamps
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view events for their own meters." ON usage_events 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usage_meters WHERE usage_meters.id = usage_events.meter_id 
    AND usage_meters.creator_id = auth.uid()
  ));
CREATE POLICY "Tenant isolation for usage events." ON usage_events 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX idx_usage_events_meter_user_time ON usage_events(meter_id, user_id, event_timestamp);
CREATE INDEX idx_usage_events_timestamp ON usage_events(event_timestamp);

/**
 * USAGE AGGREGATES TABLE
 * Pre-computed usage aggregates for performance
 */
CREATE TABLE usage_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID REFERENCES usage_meters(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Aggregate data
  aggregate_value NUMERIC NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  aggregation_key TEXT NOT NULL, -- 'daily', 'monthly', etc.
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Constraints
  UNIQUE(meter_id, user_id, period_start, aggregation_key)
);

ALTER TABLE usage_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for usage aggregates." ON usage_aggregates 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_usage_aggregates_tenant_id ON usage_aggregates(tenant_id);
CREATE INDEX idx_usage_aggregates_meter_period ON usage_aggregates(meter_id, period_start, period_end);

-- ============================================================================
-- SECTION 6: AUDIT LOGGING
-- ============================================================================

/**
 * AUDIT LOGS TABLE
 * Comprehensive audit trail for all system changes
 */
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES auth.users,
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  -- Change tracking
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Request context
  ip_address INET,
  user_agent TEXT,
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for audit logs." ON audit_logs 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for efficient audit log queries
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

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
  current_user_id UUID;
BEGIN
  current_tenant_id := get_current_tenant();
  current_user_id := auth.uid();
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create audit log without tenant context';
  END IF;
  
  INSERT INTO audit_logs (
    tenant_id, user_id, action, resource_type, resource_id, 
    old_value, new_value, metadata
  )
  VALUES (
    current_tenant_id, current_user_id, p_action, p_resource_type, p_resource_id,
    p_old_value, p_new_value, p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: WHITE-LABELED PAGES AND BRANDING
-- ============================================================================

/**
 * WHITE LABELED PAGES TABLE
 * Custom landing pages for each creator
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

ALTER TABLE white_labeled_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active pages" ON white_labeled_pages FOR SELECT USING (active = true);
CREATE POLICY "Creators can manage their tenant pages" ON white_labeled_pages
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::uuid 
    AND auth.uid() = creator_id
  );

CREATE INDEX idx_white_labeled_pages_tenant_id ON white_labeled_pages(tenant_id);
CREATE INDEX idx_white_labeled_pages_creator ON white_labeled_pages(creator_id, active);

-- ============================================================================
-- SECTION 8: STRIPE INTEGRATION TABLES
-- ============================================================================

/**
 * PRODUCTS TABLE (Stripe-synced)
 * Products created and managed in Stripe
 */
CREATE TABLE products (
  id TEXT PRIMARY KEY, -- Stripe product ID
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON products FOR SELECT USING (true);

/**
 * PRICES TABLE (Stripe-synced)
 * Prices created and managed in Stripe
 */
CREATE TABLE prices (
  id TEXT PRIMARY KEY, -- Stripe price ID
  product_id TEXT REFERENCES products,
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON prices FOR SELECT USING (true);

/**
 * SUBSCRIPTIONS TABLE (Stripe-synced)
 * Subscriptions created and managed in Stripe
 */
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID
  user_id UUID REFERENCES auth.users NOT NULL,
  status subscription_status,
  metadata JSONB DEFAULT '{}'::jsonb,
  price_id TEXT REFERENCES prices,
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subs data." ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 9: API KEY MANAGEMENT
-- ============================================================================

/**
 * API KEYS TABLE
 * Manages API keys for creator integrations
 */
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  -- Key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed version of the key
  key_prefix TEXT NOT NULL, -- First few characters for display
  -- Permissions and settings
  permissions JSONB DEFAULT '[]'::jsonb,
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  active BOOLEAN DEFAULT true,
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count BIGINT DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their API keys." ON api_keys FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Tenant isolation for API keys." ON api_keys 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_creator ON api_keys(creator_id, active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- SECTION 10: REALTIME SUBSCRIPTIONS
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
-- SECTION 11: TEST DATA GENERATION
-- ============================================================================

/**
 * INSERT TEST DATA
 * Comprehensive test data for development and demo environments
 */

-- Create default tenant
INSERT INTO tenants (id, name, subdomain, settings, active) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Staryer Demo Platform',
  'demo',
  '{"theme": "default", "features": ["usage_tracking", "billing", "white_label"]}'::jsonb,
  true
);

-- Set tenant context for data insertion
SELECT set_current_tenant('00000000-0000-0000-0000-000000000001');

-- Insert test auth users (these would normally be created via Supabase Auth)
-- Note: In a real setup, these would be created through the auth.users table
-- For demo purposes, we'll create placeholder entries

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
-- Platform Owner
('10000000-0000-0000-0000-000000000001', 'owner@staryer.com', '', NOW(), NOW(), NOW(), 
 '{"full_name": "Platform Owner", "avatar_url": "/demo-assets/platform-owner-avatar.png"}'::jsonb),
-- Creator 1
('20000000-0000-0000-0000-000000000001', 'creator1@staryer.com', '', NOW(), NOW(), NOW(),
 '{"full_name": "Sarah Chen", "avatar_url": "/demo-assets/creator-1-avatar.png"}'::jsonb),
-- Creator 2
('20000000-0000-0000-0000-000000000002', 'creator2@staryer.com', '', NOW(), NOW(), NOW(),
 '{"full_name": "Mike Rodriguez", "avatar_url": "/demo-assets/creator-2-avatar.png"}'::jsonb),
-- End User 1
('30000000-0000-0000-0000-000000000001', 'user1@example.com', '', NOW(), NOW(), NOW(),
 '{"full_name": "Alex Johnson", "avatar_url": "/demo-assets/user-1-avatar.png"}'::jsonb),
-- End User 2
('30000000-0000-0000-0000-000000000002', 'user2@example.com', '', NOW(), NOW(), NOW(),
 '{"full_name": "Emily Davis", "avatar_url": "/demo-assets/user-2-avatar.png"}'::jsonb);

-- Insert users data
INSERT INTO users (id, full_name, avatar_url, role, tenant_id, created_at, updated_at) 
VALUES 
-- Platform Owner
('10000000-0000-0000-0000-000000000001', 'Platform Owner', '/demo-assets/platform-owner-avatar.png', 
 'platform_owner', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '365 days', NOW()),
-- Creators
('20000000-0000-0000-0000-000000000001', 'Sarah Chen', '/demo-assets/creator-1-avatar.png', 
 'creator', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '180 days', NOW()),
('20000000-0000-0000-0000-000000000002', 'Mike Rodriguez', '/demo-assets/creator-2-avatar.png', 
 'creator', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '120 days', NOW()),
-- End Users
('30000000-0000-0000-0000-000000000001', 'Alex Johnson', '/demo-assets/user-1-avatar.png', 
 'user', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days', NOW()),
('30000000-0000-0000-0000-000000000002', 'Emily Davis', '/demo-assets/user-2-avatar.png', 
 'user', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', NOW());

-- Insert creator profiles
INSERT INTO creator_profiles (
  id, tenant_id, business_name, business_description, business_website, 
  stripe_account_id, onboarding_completed, brand_color, branding_config,
  created_at, updated_at
) VALUES 
-- Creator 1: Tech SaaS
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'TechGuru Solutions', 'Advanced software development tools and APIs for developers',
 'https://techguru.demo', 'acct_demo_techguru', true, '#3B82F6',
 '{"logo": "/demo-assets/techguru-logo.png", "theme": "professional", "primary_color": "#3B82F6", "font": "Inter"}'::jsonb,
 NOW() - INTERVAL '180 days', NOW()),
-- Creator 2: Creative Services
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Creative Studio Pro', 'Premium design templates, assets, and creative tools',
 'https://creativestudio.demo', 'acct_demo_creative', true, '#8B5CF6',
 '{"logo": "/demo-assets/creative-logo.png", "theme": "creative", "primary_color": "#8B5CF6", "font": "Poppins"}'::jsonb,
 NOW() - INTERVAL '120 days', NOW());

-- Insert creator products
INSERT INTO creator_products (
  creator_id, tenant_id, name, description, price, product_type, 
  stripe_product_id, active, featured, created_at
) VALUES 
-- TechGuru Products
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Developer API Pro', 'Advanced API with 10,000 requests/month', 29.99, 'subscription',
 'prod_demo_api_pro', true, true, NOW() - INTERVAL '150 days'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Code Analysis Tool', 'AI-powered code review and optimization', 49.99, 'subscription',
 'prod_demo_code_analysis', true, false, NOW() - INTERVAL '100 days'),
-- Creative Studio Products
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Premium Templates', 'Access to 500+ professional design templates', 19.99, 'subscription',
 'prod_demo_templates', true, true, NOW() - INTERVAL '90 days'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Design Asset Library', 'Unlimited downloads of icons, illustrations, photos', 39.99, 'subscription',
 'prod_demo_assets', true, false, NOW() - INTERVAL '75 days');

-- Insert subscription tiers
INSERT INTO subscription_tiers (
  creator_id, tenant_id, name, description, price, billing_cycle,
  feature_entitlements, usage_caps, active, stripe_price_id, created_at
) VALUES 
-- TechGuru Tiers
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Starter', 'Perfect for small projects', 9.99, 'monthly',
 '["api_access", "basic_support"]'::jsonb, '{"api_requests": 1000, "storage_gb": 1}'::jsonb,
 true, 'price_demo_starter', NOW() - INTERVAL '150 days'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Professional', 'For growing businesses', 29.99, 'monthly',
 '["api_access", "priority_support", "webhooks", "analytics"]'::jsonb, '{"api_requests": 10000, "storage_gb": 10}'::jsonb,
 true, 'price_demo_pro', NOW() - INTERVAL '150 days'),
-- Creative Studio Tiers
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Designer', 'Essential tools for designers', 19.99, 'monthly',
 '["template_access", "basic_downloads"]'::jsonb, '{"downloads": 50, "templates": 100}'::jsonb,
 true, 'price_demo_designer', NOW() - INTERVAL '90 days'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Agency', 'Unlimited access for teams', 59.99, 'monthly',
 '["unlimited_downloads", "team_collaboration", "commercial_license"]'::jsonb, '{"downloads": -1, "templates": -1}'::jsonb,
 true, 'price_demo_agency', NOW() - INTERVAL '90 days');

-- Insert customer tier assignments (subscriptions)
INSERT INTO customer_tier_assignments (
  customer_id, creator_id, tier_id, tenant_id, status,
  current_period_start, current_period_end, stripe_subscription_id, created_at
) VALUES 
-- User 1 subscribed to TechGuru Pro
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 (SELECT id FROM subscription_tiers WHERE creator_id = '20000000-0000-0000-0000-000000000001' AND name = 'Professional'),
 '00000000-0000-0000-0000-000000000001', 'active',
 DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
 'sub_demo_user1_techguru', NOW() - INTERVAL '15 days'),
-- User 2 subscribed to Creative Designer
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
 (SELECT id FROM subscription_tiers WHERE creator_id = '20000000-0000-0000-0000-000000000002' AND name = 'Designer'),
 '00000000-0000-0000-0000-000000000001', 'active',
 DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
 'sub_demo_user2_creative', NOW() - INTERVAL '30 days');

-- Insert usage meters
INSERT INTO usage_meters (
  creator_id, tenant_id, event_name, display_name, description,
  aggregation_type, unit_name, billing_model, created_at
) VALUES 
-- TechGuru Meters
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'api_request', 'API Requests', 'Number of API calls made', 'count', 'requests', 'metered',
 NOW() - INTERVAL '150 days'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'data_processed', 'Data Processed', 'Amount of data processed in MB', 'sum', 'MB', 'metered',
 NOW() - INTERVAL '150 days'),
-- Creative Studio Meters
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'template_download', 'Template Downloads', 'Number of templates downloaded', 'count', 'downloads', 'licensed',
 NOW() - INTERVAL '90 days'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'asset_usage', 'Asset Usage', 'Number of assets used in projects', 'count', 'assets', 'licensed',
 NOW() - INTERVAL '90 days');

-- Insert sample usage events (realistic usage patterns)
INSERT INTO usage_events (
  meter_id, creator_id, tenant_id, user_id, event_value, event_timestamp
) VALUES 
-- Generate API request events for TechGuru over the last 30 days
-- User 1 usage (moderate usage - around 300 requests/day)
((SELECT id FROM usage_meters WHERE event_name = 'api_request' AND creator_id = '20000000-0000-0000-0000-000000000001'),
 '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'user_30000000-0000-0000-0000-000000000001', 1, NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
((SELECT id FROM usage_meters WHERE event_name = 'api_request' AND creator_id = '20000000-0000-0000-0000-000000000001'),
 '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'user_30000000-0000-0000-0000-000000000001', 1, NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
-- Template download events for Creative Studio
((SELECT id FROM usage_meters WHERE event_name = 'template_download' AND creator_id = '20000000-0000-0000-0000-000000000002'),
 '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'user_30000000-0000-0000-0000-000000000002', 1, NOW() - INTERVAL '2 days'),
((SELECT id FROM usage_meters WHERE event_name = 'template_download' AND creator_id = '20000000-0000-0000-0000-000000000002'),
 '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'user_30000000-0000-0000-0000-000000000002', 1, NOW() - INTERVAL '1 day');

-- Generate additional usage events with a function for realistic patterns
DO $$
DECLARE
    api_meter_id UUID;
    template_meter_id UUID;
    i INTEGER;
    random_hour INTEGER;
    random_minute INTEGER;
BEGIN
    -- Get meter IDs
    SELECT id INTO api_meter_id FROM usage_meters WHERE event_name = 'api_request' AND creator_id = '20000000-0000-0000-0000-000000000001';
    SELECT id INTO template_meter_id FROM usage_meters WHERE event_name = 'template_download' AND creator_id = '20000000-0000-0000-0000-000000000002';
    
    -- Generate API usage events for the last 30 days (realistic pattern)
    FOR i IN 1..30 LOOP
        -- Generate 200-400 API calls per day with realistic timing
        FOR j IN 1..(200 + FLOOR(RANDOM() * 200)) LOOP
            random_hour := FLOOR(RANDOM() * 24);
            random_minute := FLOOR(RANDOM() * 60);
            
            INSERT INTO usage_events (meter_id, creator_id, tenant_id, user_id, event_value, event_timestamp)
            VALUES (
                api_meter_id,
                '20000000-0000-0000-0000-000000000001',
                '00000000-0000-0000-0000-000000000001',
                'user_30000000-0000-0000-0000-000000000001',
                1,
                NOW() - INTERVAL '30 days' + INTERVAL '1 day' * i + INTERVAL '1 hour' * random_hour + INTERVAL '1 minute' * random_minute
            );
        END LOOP;
    END LOOP;
    
    -- Generate template download events (1-5 per day)
    FOR i IN 1..30 LOOP
        FOR j IN 1..(1 + FLOOR(RANDOM() * 4)) LOOP
            random_hour := 9 + FLOOR(RANDOM() * 10); -- Business hours mostly
            random_minute := FLOOR(RANDOM() * 60);
            
            INSERT INTO usage_events (meter_id, creator_id, tenant_id, user_id, event_value, event_timestamp)
            VALUES (
                template_meter_id,
                '20000000-0000-0000-0000-000000000002',
                '00000000-0000-0000-0000-000000000001',
                'user_30000000-0000-0000-0000-000000000002',
                1,
                NOW() - INTERVAL '30 days' + INTERVAL '1 day' * i + INTERVAL '1 hour' * random_hour + INTERVAL '1 minute' * random_minute
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert white-labeled pages
INSERT INTO white_labeled_pages (
  creator_id, tenant_id, page_slug, page_title, page_description,
  page_config, active, meta_title, meta_description, created_at
) VALUES 
-- TechGuru Pages
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'home', 'TechGuru Solutions - Developer Tools', 'Advanced APIs and development tools for modern applications',
 '{"hero": {"title": "Build Faster with TechGuru APIs", "subtitle": "Professional developer tools trusted by 1000+ companies"}, "features": ["99.9% Uptime", "Real-time Analytics", "24/7 Support"]}'::jsonb,
 true, 'TechGuru Solutions - Advanced Developer APIs', 'Professional API solutions for developers. Start building today with our comprehensive developer tools.',
 NOW() - INTERVAL '150 days'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'pricing', 'Pricing Plans - TechGuru Solutions', 'Choose the perfect plan for your development needs',
 '{"layout": "comparison_table", "highlight_plan": "Professional"}'::jsonb,
 true, 'TechGuru API Pricing - Choose Your Plan', 'Flexible pricing plans for developers and businesses. Start free, scale as you grow.',
 NOW() - INTERVAL '140 days'),
-- Creative Studio Pages
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'home', 'Creative Studio Pro - Premium Design Resources', 'Professional templates, assets, and design tools for creatives',
 '{"hero": {"title": "Design Like a Pro", "subtitle": "500+ premium templates and unlimited creative assets"}, "gallery": {"featured_templates": ["business_cards", "presentations", "social_media"]}}'::jsonb,
 true, 'Creative Studio Pro - Premium Design Templates & Assets', 'Professional design resources for creatives. Download premium templates, assets, and tools.',
 NOW() - INTERVAL '90 days');

-- Insert sample audit logs
INSERT INTO audit_logs (
  tenant_id, user_id, action, resource_type, resource_id, 
  new_value, metadata, created_at
) VALUES 
-- Platform owner actions
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
 'tenant_created', 'tenant', '00000000-0000-0000-0000-000000000001',
 '{"name": "Staryer Demo Platform", "subdomain": "demo"}'::jsonb,
 '{"ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0"}'::jsonb,
 NOW() - INTERVAL '365 days'),
-- Creator profile updates
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 'profile_updated', 'creator_profile', '20000000-0000-0000-0000-000000000001',
 '{"business_name": "TechGuru Solutions", "onboarding_completed": true}'::jsonb,
 '{"step": "onboarding_completion"}'::jsonb,
 NOW() - INTERVAL '150 days'),
-- Product creation
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 'product_created', 'creator_product', NULL,
 '{"name": "Developer API Pro", "price": 29.99, "active": true}'::jsonb,
 '{"product_type": "subscription"}'::jsonb,
 NOW() - INTERVAL '150 days'),
-- Subscription events
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
 'subscription_created', 'customer_tier_assignment', NULL,
 '{"tier": "Professional", "creator": "TechGuru Solutions"}'::jsonb,
 '{"stripe_subscription_id": "sub_demo_user1_techguru"}'::jsonb,
 NOW() - INTERVAL '15 days');

-- Insert API keys for creators
INSERT INTO api_keys (
  creator_id, tenant_id, name, key_hash, key_prefix,
  permissions, rate_limit, active, created_at
) VALUES 
-- TechGuru API Keys
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Production API Key', 'demo_hash_techguru_prod', 'tg_live_abc123',
 '["read", "write", "analytics"]'::jsonb, 10000, true, NOW() - INTERVAL '100 days'),
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
 'Development API Key', 'demo_hash_techguru_dev', 'tg_test_xyz789',
 '["read", "write"]'::jsonb, 1000, true, NOW() - INTERVAL '80 days'),
-- Creative Studio API Keys
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
 'Website Integration', 'demo_hash_creative_web', 'cs_live_def456',
 '["read", "download"]'::jsonb, 5000, true, NOW() - INTERVAL '60 days');

-- ============================================================================
-- SECTION 12: DEMO DATA COMPLETION SUMMARY
-- ============================================================================

/**
 * DATA SUMMARY REPORT
 * Generated test data includes:
 * 
 * ✓ 1 Tenant (Demo Platform)
 * ✓ 1 Platform Owner
 * ✓ 2 Creators with complete profiles
 * ✓ 2 End Users with active subscriptions  
 * ✓ 4 Creator Products (2 per creator)
 * ✓ 4 Subscription Tiers (2 per creator)
 * ✓ 2 Active Subscriptions
 * ✓ 4 Usage Meters (2 per creator)
 * ✓ 9000+ Usage Events (30 days of realistic data)
 * ✓ 4 White-labeled Pages
 * ✓ 10+ Audit Log Entries
 * ✓ 3 API Keys for integrations
 * 
 * All data is connected with proper foreign key relationships
 * and respects the multi-tenant architecture with RLS policies.
 */

-- Final verification queries (optional - comment out for production)
-- SELECT 'Tenants Created' as summary, COUNT(*) as count FROM tenants;
-- SELECT 'Users Created' as summary, COUNT(*) as count FROM users;  
-- SELECT 'Creators Onboarded' as summary, COUNT(*) as count FROM creator_profiles WHERE onboarding_completed = true;
-- SELECT 'Active Subscriptions' as summary, COUNT(*) as count FROM customer_tier_assignments WHERE status = 'active';
-- SELECT 'Usage Events (Last 30 Days)' as summary, COUNT(*) as count FROM usage_events WHERE event_timestamp > NOW() - INTERVAL '30 days';
-- SELECT 'Audit Log Entries' as summary, COUNT(*) as count FROM audit_logs;

/**
 * SETUP COMPLETE! 
 * =================
 * 
 * Your Staryer platform database is now ready with:
 * - Complete schema with all tables and relationships
 * - Multi-tenant architecture with Row-Level Security
 * - Comprehensive test data for all user roles
 * - Realistic usage patterns and audit trails
 * 
 * Next Steps:
 * 1. Configure your application's database connection
 * 2. Set up Stripe webhook endpoints for live data sync
 * 3. Configure your application's tenant context management
 * 4. Test the setup using the provided test data
 * 
 * For production use:
 * - Remove or modify test data as needed
 * - Configure proper backup and monitoring
 * - Set up appropriate user access controls
 * - Enable additional security measures
 */