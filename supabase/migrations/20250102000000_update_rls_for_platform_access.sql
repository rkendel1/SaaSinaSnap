-- Function to get the current user's role from the public.users table
-- This function is SECURITY DEFINER to allow it to read the 'users' table
-- even if RLS is enabled on 'users' for the calling user.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Re-enable RLS on all tables and update policies to allow platform_owner access
-- This assumes all tables have a 'tenant_id' column where applicable,
-- or a 'creator_id'/'user_id' for direct ownership.

-- Table: tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON public.tenants;
CREATE POLICY "tenant_isolation" ON public.tenants
  FOR ALL USING (id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_isolation" ON public.users;
CREATE POLICY "users_isolation" ON public.users
  FOR ALL USING (id = auth.uid() OR get_user_role() = 'platform_owner');

-- Table: platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_settings_isolation" ON public.platform_settings;
CREATE POLICY "platform_settings_isolation" ON public.platform_settings
  FOR ALL USING (owner_id = auth.uid());

-- Table: creator_profiles
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_profiles_isolation" ON public.creator_profiles;
CREATE POLICY "creator_profiles_isolation" ON public.creator_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: creator_products
ALTER TABLE public.creator_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_products_isolation" ON public.creator_products;
CREATE POLICY "creator_products_isolation" ON public.creator_products
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: creator_webhooks
ALTER TABLE public.creator_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_webhooks_isolation" ON public.creator_webhooks;
CREATE POLICY "creator_webhooks_isolation" ON public.creator_webhooks
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: white_labeled_pages
ALTER TABLE public.white_labeled_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "white_labeled_pages_isolation" ON public.white_labeled_pages;
CREATE POLICY "white_labeled_pages_isolation" ON public.white_labeled_pages
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: embed_assets (creator_id based, not tenant_id)
ALTER TABLE public.embed_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "embed_assets_isolation" ON public.embed_assets;
CREATE POLICY "embed_assets_isolation" ON public.embed_assets
  FOR ALL USING (creator_id = auth.uid() OR get_user_role() = 'platform_owner');

-- Table: asset_sharing_logs (linked to embed_assets)
ALTER TABLE public.asset_sharing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asset_sharing_logs_isolation" ON public.asset_sharing_logs;
CREATE POLICY "asset_sharing_logs_isolation" ON public.asset_sharing_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.embed_assets ea WHERE ea.id = asset_id AND (ea.creator_id = auth.uid() OR get_user_role() = 'platform_owner')));

-- Table: ai_customization_sessions (creator_id based, not tenant_id)
ALTER TABLE public.ai_customization_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_customization_sessions_isolation" ON public.ai_customization_sessions;
CREATE POLICY "ai_customization_sessions_isolation" ON public.ai_customization_sessions
  FOR ALL USING (creator_id = auth.uid() OR get_user_role() = 'platform_owner');

-- Table: creator_analytics
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator_analytics_isolation" ON public.creator_analytics;
CREATE POLICY "creator_analytics_isolation" ON public.creator_analytics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: products (platform-level products, has tenant_id)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_isolation" ON public.products;
CREATE POLICY "products_isolation" ON public.products
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: prices (platform-level prices, has tenant_id)
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prices_isolation" ON public.prices;
CREATE POLICY "prices_isolation" ON public.prices
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: subscriptions (user_id based, not tenant_id)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_isolation" ON public.subscriptions;
CREATE POLICY "subscriptions_isolation" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid() OR get_user_role() = 'platform_owner');

-- Table: subscribed_products (linked to subscriptions)
ALTER TABLE public.subscribed_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscribed_products_isolation" ON public.subscribed_products;
CREATE POLICY "subscribed_products_isolation" ON public.subscribed_products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND (s.user_id = auth.uid() OR get_user_role() = 'platform_owner')));

-- Table: customers (user_id based, not tenant_id)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_isolation" ON public.customers;
CREATE POLICY "customers_isolation" ON public.customers
  FOR ALL USING (id = auth.uid() OR get_user_role() = 'platform_owner');

-- Table: usage_meters
ALTER TABLE public.usage_meters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_meters_isolation" ON public.usage_meters;
CREATE POLICY "usage_meters_isolation" ON public.usage_meters
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: meter_plan_limits
ALTER TABLE public.meter_plan_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meter_plan_limits_isolation" ON public.meter_plan_limits;
CREATE POLICY "meter_plan_limits_isolation" ON public.meter_plan_limits
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: usage_events
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_events_isolation" ON public.usage_events;
CREATE POLICY "usage_events_isolation" ON public.usage_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: usage_aggregates
ALTER TABLE public.usage_aggregates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_aggregates_isolation" ON public.usage_aggregates;
CREATE POLICY "usage_aggregates_isolation" ON public.usage_aggregates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: usage_alerts
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_alerts_isolation" ON public.usage_alerts;
CREATE POLICY "usage_alerts_isolation" ON public.usage_alerts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: usage_billing_sync
ALTER TABLE public.usage_billing_sync ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_billing_sync_isolation" ON public.usage_billing_sync;
CREATE POLICY "usage_billing_sync_isolation" ON public.usage_billing_sync
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: subscription_tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_tiers_isolation" ON public.subscription_tiers;
CREATE POLICY "subscription_tiers_isolation" ON public.subscription_tiers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: customer_tier_assignments
ALTER TABLE public.customer_tier_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_tier_assignments_isolation" ON public.customer_tier_assignments;
CREATE POLICY "customer_tier_assignments_isolation" ON public.customer_tier_assignments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: tier_usage_overages
ALTER TABLE public.tier_usage_overages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tier_usage_overages_isolation" ON public.tier_usage_overages;
CREATE POLICY "tier_usage_overages_isolation" ON public.tier_usage_overages
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: tier_analytics
ALTER TABLE public.tier_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tier_analytics_isolation" ON public.tier_analytics;
CREATE POLICY "tier_analytics_isolation" ON public.tier_analytics
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_events_isolation" ON public.analytics_events;
CREATE POLICY "analytics_events_isolation" ON public.analytics_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: connector_events
ALTER TABLE public.connector_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "connector_events_isolation" ON public.connector_events;
CREATE POLICY "connector_events_isolation" ON public.connector_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: stripe_environment_configs
ALTER TABLE public.stripe_environment_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stripe_environment_configs_isolation" ON public.stripe_environment_configs;
CREATE POLICY "stripe_environment_configs_isolation" ON public.stripe_environment_configs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: product_environment_deployments
ALTER TABLE public.product_environment_deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_environment_deployments_isolation" ON public.product_environment_deployments;
CREATE POLICY "product_environment_deployments_isolation" ON public.product_environment_deployments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');

-- Table: environment_sync_logs
ALTER TABLE public.environment_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "environment_sync_logs_isolation" ON public.environment_sync_logs;
CREATE POLICY "environment_sync_logs_isolation" ON public.environment_sync_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid OR get_user_role() = 'platform_owner');