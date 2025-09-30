-- Disable RLS on all tables to allow schema modifications
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE creator_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tier_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meters DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregates DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_billing_sync DISABLE ROW LEVEL SECURITY;
ALTER TABLE tier_usage_overages DISABLE ROW LEVEL SECURITY;
ALTER TABLE white_labeled_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE creator_webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE embed_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE embed_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE embed_ab_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE embed_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_customization_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_headers DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscribed_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_success_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_environment_deployments DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;


-- Drop RLS policies that might depend on tenant_id or tenants table
DROP POLICY IF EXISTS "Users can view their own tenant_id" ON users;
DROP POLICY IF EXISTS "Creators can manage their own tenant_id" ON creator_profiles;
DROP POLICY IF EXISTS "Creators can manage their own products" ON creator_products;
DROP POLICY IF EXISTS "Creators can manage their own tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Customers can manage their own assignments" ON customer_tier_assignments;
DROP POLICY IF EXISTS "Creators can manage their own meters" ON usage_meters;
DROP POLICY IF EXISTS "Users can track their own usage" ON usage_events;
DROP POLICY IF EXISTS "Users can view their own usage aggregates" ON usage_aggregates;
DROP POLICY IF EXISTS "Users can view their own usage alerts" ON usage_alerts;
DROP POLICY IF EXISTS "Creators can manage their own billing sync" ON usage_billing_sync;
DROP POLICY IF EXISTS "Users can view their own overages" ON tier_usage_overages;
DROP POLICY IF EXISTS "Creators can manage their own pages" ON white_labeled_pages;
DROP POLICY IF EXISTS "Creators can manage their own webhooks" ON creator_webhooks;
DROP POLICY IF EXISTS "Creators can view their own analytics" ON creator_analytics;
DROP POLICY IF EXISTS "Creators can manage their own embed assets" ON embed_assets;
DROP POLICY IF EXISTS "Creators can manage their own embed updates" ON embed_updates;
DROP POLICY IF EXISTS "Creators can manage their own A/B tests" ON embed_ab_tests;
DROP POLICY IF EXISTS "Creators can manage their own embed configurations" ON embed_configurations;
DROP POLICY IF EXISTS "Creators can manage their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API key usage" ON api_key_usage;
DROP POLICY IF EXISTS "Creators can manage their own API key rotations" ON api_key_rotations;
DROP POLICY IF EXISTS "Creators can manage their own AI sessions" ON ai_customization_sessions;
DROP POLICY IF EXISTS "Creators can manage their own site analysis" ON site_analysis;
DROP POLICY IF EXISTS "Creators can manage their own generated headers" ON generated_headers;
DROP POLICY IF EXISTS "Users can view their subscribed products" ON subscribed_products;
DROP POLICY IF EXISTS "Users can view their own subscription success events" ON subscription_success_events;
DROP POLICY IF EXISTS "Creators can manage their own product deployments" ON product_environment_deployments;
DROP POLICY IF EXISTS "Platform owners can manage settings" ON platform_settings;
DROP POLICY IF EXISTS "Public products are viewable" ON products;
DROP POLICY IF EXISTS "Public prices are viewable" ON prices;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;


-- Drop multi-tenant functions
DROP FUNCTION IF EXISTS set_current_tenant(tenant_uuid uuid);
DROP FUNCTION IF EXISTS get_current_tenant();
DROP FUNCTION IF EXISTS get_user_role(user_id uuid);
DROP FUNCTION IF EXISTS get_user_tenant_id(user_id uuid);


-- Drop foreign key constraints that depend on tenant_id or tenants table
-- Find and drop FKs referencing tenants.id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT conname, relname
              FROM pg_constraint pc
              JOIN pg_class pr ON pr.oid = pc.conrelid
              WHERE contype = 'f' AND confrelid = (SELECT oid FROM pg_class WHERE relname = 'tenants'))
    LOOP
        EXECUTE 'ALTER TABLE ' || r.relname || ' DROP CONSTRAINT ' || r.conname || ';';
    END LOOP;
END $$;

-- Drop foreign key constraints from tables to users.id if they reference tenant_id implicitly
-- This is less common but good to include if such a setup exists.
-- For example, if creator_profiles.id references users.id, and users.id was somehow tied to tenant_id.
-- In a typical setup, creator_profiles.id would reference users.id, and creator_profiles.tenant_id would reference tenants.id.

-- Remove tenant_id columns from all relevant tables
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_profiles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscription_tiers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customer_tier_assignments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_meters DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_events DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_aggregates DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_alerts DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE usage_billing_sync DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tier_usage_overages DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE white_labeled_pages DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_webhooks DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE creator_analytics DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE embed_assets DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE embed_updates DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE embed_ab_tests DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE embed_configurations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE api_keys DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE api_key_usage DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE api_key_rotations DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE ai_customization_sessions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE site_analysis DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE generated_headers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscribed_products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscription_success_events DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_environment_deployments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE prices DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customers DROP COLUMN IF EXISTS tenant_id;


-- Drop the tenants table
DROP TABLE IF EXISTS tenants;


-- Re-enable RLS on tables where it should still be active (after tenant_id is gone)
-- Note: You will need to redefine policies for these tables if they were dropped.
-- For now, we just re-enable RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_billing_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_usage_overages ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_labeled_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_customization_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_success_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_environment_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;