/**
 * REMOVE MULTI-TENANT SUPPORT
 * This migration removes multi-tenant support and related structures
 * to streamline the application for single-tenant usage
 */

-- First, remove all RLS policies that reference tenant_id
DROP POLICY IF EXISTS "Tenant isolation for subscription tiers." ON subscription_tiers;
DROP POLICY IF EXISTS "Tenant isolation for customer tier assignments." ON customer_tier_assignments;
DROP POLICY IF EXISTS "Tenant isolation for creator profiles." ON creator_profiles;
DROP POLICY IF EXISTS "Tenant isolation for creator analytics." ON creator_analytics;
DROP POLICY IF EXISTS "Tenant isolation for creator products." ON creator_products;
DROP POLICY IF EXISTS "Tenant isolation for white labeled pages." ON white_labeled_pages;
DROP POLICY IF EXISTS "Tenant isolation for usage events." ON usage_events;
DROP POLICY IF EXISTS "Tenant isolation for usage meters." ON usage_meters;
DROP POLICY IF EXISTS "Tenant isolation for usage aggregates." ON usage_aggregates;
DROP POLICY IF EXISTS "Tenant isolation for meter plan limits." ON meter_plan_limits;
DROP POLICY IF EXISTS "Tenant isolation for audit logs." ON audit_logs;
DROP POLICY IF EXISTS "Tenant isolation for connector events." ON connector_events;
DROP POLICY IF EXISTS "Tenant isolation for analytics events." ON analytics_events;

-- Restore original RLS policies for main tables
CREATE POLICY "Creators can manage their own tiers." ON subscription_tiers 
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Public can view active tiers." ON subscription_tiers 
  FOR SELECT USING (active = true);

CREATE POLICY "Customers can view their own assignments." ON customer_tier_assignments 
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Creators can view assignments for their tiers." ON customer_tier_assignments 
  FOR SELECT USING (
    tier_id IN (
      SELECT id FROM subscription_tiers WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage assignments for their tiers." ON customer_tier_assignments 
  FOR ALL USING (
    tier_id IN (
      SELECT id FROM subscription_tiers WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage their own profiles." ON creator_profiles 
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Public can view completed creator profiles." ON creator_profiles 
  FOR SELECT USING (onboarding_completed = true);

CREATE POLICY "Creators can view their own analytics." ON creator_analytics 
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Creators can manage their own products." ON creator_products 
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Public can view active products." ON creator_products 
  FOR SELECT USING (active = true);

CREATE POLICY "Creators can manage their own pages." ON white_labeled_pages 
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Public can view active pages." ON white_labeled_pages 
  FOR SELECT USING (active = true);

-- Remove tenant_id columns from all relevant tables
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscription_tiers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customer_tier_assignments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_analytics DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE white_labeled_pages DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_events DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_meters DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_aggregates DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE meter_plan_limits DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE api_keys DROP COLUMN IF EXISTS tenant_id;

-- Remove tenant-specific tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS connector_events;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS tenants;

-- Remove tenant-related functions
DROP FUNCTION IF EXISTS set_current_tenant(uuid);
DROP FUNCTION IF EXISTS get_current_tenant();
DROP FUNCTION IF EXISTS ensure_tenant_context();

-- Remove tenant-related indexes
DROP INDEX IF EXISTS idx_tenants_subdomain;
DROP INDEX IF EXISTS idx_tenants_domain;
DROP INDEX IF EXISTS idx_tenants_active;
DROP INDEX IF EXISTS idx_users_tenant_id;

-- Remove other tenant_id indexes if they exist
DROP INDEX IF EXISTS idx_subscription_tiers_tenant_id;
DROP INDEX IF EXISTS idx_customer_tier_assignments_tenant_id;
DROP INDEX IF EXISTS idx_creator_profiles_tenant_id;
DROP INDEX IF EXISTS idx_creator_analytics_tenant_id;
DROP INDEX IF EXISTS idx_creator_products_tenant_id;
DROP INDEX IF EXISTS idx_white_labeled_pages_tenant_id;
DROP INDEX IF EXISTS idx_usage_events_tenant_id;
DROP INDEX IF EXISTS idx_usage_meters_tenant_id;
DROP INDEX IF EXISTS idx_usage_aggregates_tenant_id;
DROP INDEX IF EXISTS idx_meter_plan_limits_tenant_id;
DROP INDEX IF EXISTS idx_api_keys_tenant_id;

-- Create standard indexes to replace tenant-specific ones where needed
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_creator_id ON subscription_tiers(creator_id);
CREATE INDEX IF NOT EXISTS idx_customer_tier_assignments_customer_id ON customer_tier_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_creator_products_creator_id ON creator_products(creator_id);
CREATE INDEX IF NOT EXISTS idx_white_labeled_pages_creator_id ON white_labeled_pages(creator_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_meters_creator_id ON usage_meters(creator_id);
CREATE INDEX IF NOT EXISTS idx_usage_aggregates_user_id ON usage_aggregates(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_creator_id ON api_keys(creator_id);