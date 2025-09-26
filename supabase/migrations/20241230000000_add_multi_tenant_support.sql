/**
 * MULTI-TENANT SUPPORT
 * Note: This migration adds multi-tenant support with Row-Level Security (RLS)
 * for secure data isolation between tenants
 */

-- First, let's create a tenants table to manage tenant information
create table tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subdomain text unique,
  custom_domain text unique,
  settings jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tenants enable row level security;
-- For now, we'll allow platform owners to manage tenants - this can be refined later
create policy "Platform owners can manage tenants." on tenants for all using (true);

-- Create indexes for efficient queries
create index idx_tenants_subdomain on tenants(subdomain);
create index idx_tenants_domain on tenants(custom_domain);
create index idx_tenants_active on tenants(active);

/**
 * ADD TENANT_ID TO EXISTING TABLES
 */

-- Add tenant_id to users table
alter table users add column tenant_id uuid references tenants(id);
create index idx_users_tenant_id on users(tenant_id);

-- Add tenant_id to usage_events table  
alter table usage_events add column tenant_id uuid references tenants(id);
create index idx_usage_events_tenant_id on usage_events(tenant_id);

-- Add tenant_id to usage_meters table
alter table usage_meters add column tenant_id uuid references tenants(id);
create index idx_usage_meters_tenant_id on usage_meters(tenant_id);

-- Add tenant_id to usage_aggregates table
alter table usage_aggregates add column tenant_id uuid references tenants(id);
create index idx_usage_aggregates_tenant_id on usage_aggregates(tenant_id);

-- Add tenant_id to usage_alerts table  
alter table usage_alerts add column tenant_id uuid references tenants(id);
create index idx_usage_alerts_tenant_id on usage_alerts(tenant_id);

-- Add tenant_id to meter_plan_limits table
alter table meter_plan_limits add column tenant_id uuid references tenants(id);
create index idx_meter_plan_limits_tenant_id on meter_plan_limits(tenant_id);

-- Add tenant_id to usage_billing_sync table
alter table usage_billing_sync add column tenant_id uuid references tenants(id);
create index idx_usage_billing_sync_tenant_id on usage_billing_sync(tenant_id);

-- Add tenant_id to subscription_tiers table
alter table subscription_tiers add column tenant_id uuid references tenants(id);
create index idx_subscription_tiers_tenant_id on subscription_tiers(tenant_id);

-- Add tenant_id to customer_tier_assignments table
alter table customer_tier_assignments add column tenant_id uuid references tenants(id);
create index idx_customer_tier_assignments_tenant_id on customer_tier_assignments(tenant_id);

-- Add tenant_id to tier_usage_overages table
alter table tier_usage_overages add column tenant_id uuid references tenants(id);
create index idx_tier_usage_overages_tenant_id on tier_usage_overages(tenant_id);

-- Add tenant_id to tier_analytics table
alter table tier_analytics add column tenant_id uuid references tenants(id);
create index idx_tier_analytics_tenant_id on tier_analytics(tenant_id);

-- Add tenant_id to creator_profiles table
alter table creator_profiles add column tenant_id uuid references tenants(id);
create index idx_creator_profiles_tenant_id on creator_profiles(tenant_id);

-- Add tenant_id to creator_analytics table
alter table creator_analytics add column tenant_id uuid references tenants(id);
create index idx_creator_analytics_tenant_id on creator_analytics(tenant_id);

-- Add tenant_id to creator_products table
alter table creator_products add column tenant_id uuid references tenants(id);
create index idx_creator_products_tenant_id on creator_products(tenant_id);

-- Add tenant_id to white_labeled_pages table
alter table white_labeled_pages add column tenant_id uuid references tenants(id);
create index idx_white_labeled_pages_tenant_id on white_labeled_pages(tenant_id);

-- Add tenant_id to creator_webhooks table
alter table creator_webhooks add column tenant_id uuid references tenants(id);
create index idx_creator_webhooks_tenant_id on creator_webhooks(tenant_id);

/**
 * CREATE NEW TABLES FOR AUDIT LOGGING AND CONNECTOR EVENTS
 */

-- Audit logs table for tracking all changes with tenant context
create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  user_id uuid references auth.users,
  action text not null,
  resource_type text not null,
  resource_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;
create policy "Tenant isolation for audit logs." on audit_logs 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for efficient audit log queries
create index idx_audit_logs_tenant_id on audit_logs(tenant_id);
create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_action on audit_logs(action);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_audit_logs_created_at on audit_logs(created_at desc);

-- Connector events table for tracking integration actions
create table connector_events (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  user_id uuid references auth.users,
  connector_type text not null, -- 'slack', 'zapier', 'posthog', 'crm', etc.
  event_type text not null,
  event_data jsonb not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed', 'retrying')),
  error_message text,
  retry_count integer default 0,
  external_id text, -- ID from external system
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table connector_events enable row level security;
create policy "Tenant isolation for connector events." on connector_events 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for efficient connector event queries  
create index idx_connector_events_tenant_id on connector_events(tenant_id);
create index idx_connector_events_user_id on connector_events(user_id);
create index idx_connector_events_type on connector_events(connector_type, event_type);
create index idx_connector_events_status on connector_events(status);
create index idx_connector_events_created_at on connector_events(created_at desc);

-- Analytics events table for PostHog and other analytics
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  user_id uuid references auth.users,
  event_name text not null,
  event_properties jsonb default '{}'::jsonb,
  distinct_id text not null,
  session_id text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_to_posthog boolean default false,
  posthog_event_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table analytics_events enable row level security;
create policy "Tenant isolation for analytics events." on analytics_events 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for efficient analytics queries
create index idx_analytics_events_tenant_id on analytics_events(tenant_id);
create index idx_analytics_events_user_id on analytics_events(user_id);
create index idx_analytics_events_name on analytics_events(event_name);
create index idx_analytics_events_timestamp on analytics_events(timestamp desc);
create index idx_analytics_events_distinct_id on analytics_events(distinct_id);

/**
 * TENANT CONTEXT FUNCTIONS
 */

-- Function to set current tenant context
create or replace function set_current_tenant(tenant_uuid uuid)
returns void as $$
begin
  perform set_config('app.current_tenant', tenant_uuid::text, true);
end;
$$ language plpgsql security definer;

-- Function to get current tenant context
create or replace function get_current_tenant()
returns uuid as $$
begin
  return current_setting('app.current_tenant', true)::uuid;
exception 
  when others then
    return null;
end;
$$ language plpgsql;

-- Function to ensure tenant context is set
create or replace function ensure_tenant_context()
returns uuid as $$
declare
  tenant_uuid uuid;
begin
  tenant_uuid := get_current_tenant();
  if tenant_uuid is null then
    raise exception 'Tenant context not set. Call set_current_tenant() first.';
  end if;
  return tenant_uuid;
end;
$$ language plpgsql;

/**
 * UPDATE ROW LEVEL SECURITY POLICIES
 */

-- Update users table RLS policies
drop policy if exists "Can view own user data." on users;
drop policy if exists "Can update own user data." on users;

create policy "Tenant isolation for users." on users 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update usage_events table RLS policies  
drop policy if exists "Creators can view events for their own meters." on usage_events;

create policy "Tenant isolation for usage events." on usage_events 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update usage_meters table RLS policies
drop policy if exists "Creators can manage their own meters." on usage_meters;

create policy "Tenant isolation for usage meters." on usage_meters 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update usage_aggregates table RLS policies
drop policy if exists "Creators can view aggregates for their own meters." on usage_aggregates;

create policy "Tenant isolation for usage aggregates." on usage_aggregates 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update usage_alerts table RLS policies
drop policy if exists "Creators can view alerts for their own meters." on usage_alerts;

create policy "Tenant isolation for usage alerts." on usage_alerts 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update meter_plan_limits table RLS policies
drop policy if exists "Creators can manage limits for their own meters." on meter_plan_limits;

create policy "Tenant isolation for meter plan limits." on meter_plan_limits 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update usage_billing_sync table RLS policies
drop policy if exists "Creators can view billing sync for their own meters." on usage_billing_sync;

create policy "Tenant isolation for usage billing sync." on usage_billing_sync 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update subscription_tiers table RLS policies
drop policy if exists "Creators can manage their own tiers." on subscription_tiers;
drop policy if exists "Public can view active tiers." on subscription_tiers;

create policy "Tenant isolation for subscription tiers." on subscription_tiers 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update customer_tier_assignments table RLS policies
drop policy if exists "Customers can view their own assignments." on customer_tier_assignments;
drop policy if exists "Creators can view assignments for their tiers." on customer_tier_assignments;
drop policy if exists "Creators can manage assignments for their tiers." on customer_tier_assignments;

create policy "Tenant isolation for customer tier assignments." on customer_tier_assignments 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update tier_usage_overages table RLS policies
drop policy if exists "Customers can view their own overages." on tier_usage_overages;
drop policy if exists "Creators can view overages for their customers." on tier_usage_overages;
drop policy if exists "Creators can manage overages for their customers." on tier_usage_overages;

create policy "Tenant isolation for tier usage overages." on tier_usage_overages 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update tier_analytics table RLS policies
drop policy if exists "Creators can view analytics for their tiers." on tier_analytics;

create policy "Tenant isolation for tier analytics." on tier_analytics 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update creator_profiles table RLS policies
drop policy if exists "Can view own creator profile." on creator_profiles;
drop policy if exists "Can update own creator profile." on creator_profiles;
drop policy if exists "Can insert own creator profile." on creator_profiles;

create policy "Tenant isolation for creator profiles." on creator_profiles 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update creator_analytics table RLS policies
drop policy if exists "Creators can view their own analytics." on creator_analytics;

create policy "Tenant isolation for creator analytics." on creator_analytics 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update creator_products table RLS policies
drop policy if exists "Creators can manage their own products." on creator_products;
drop policy if exists "Public can view active products." on creator_products;

create policy "Tenant isolation for creator products." on creator_products 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update white_labeled_pages table RLS policies
drop policy if exists "Creators can manage their own pages." on white_labeled_pages;
drop policy if exists "Public can view active pages." on white_labeled_pages;

create policy "Tenant isolation for white labeled pages." on white_labeled_pages 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Update creator_webhooks table RLS policies
drop policy if exists "Creators can manage their own webhooks." on creator_webhooks;

create policy "Tenant isolation for creator webhooks." on creator_webhooks 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Add update triggers for new tables
create trigger update_tenants_updated_at before update on tenants 
  for each row execute procedure update_updated_at_column();

create trigger update_connector_events_updated_at before update on connector_events 
  for each row execute procedure update_updated_at_column();

/**
 * HELPER FUNCTIONS FOR TENANT MANAGEMENT
 */

-- Function to create a new tenant
create or replace function create_tenant(
  tenant_name text,
  tenant_subdomain text default null,
  tenant_settings jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  new_tenant_id uuid;
begin
  insert into tenants (name, subdomain, settings)
  values (tenant_name, tenant_subdomain, tenant_settings)
  returning id into new_tenant_id;
  
  return new_tenant_id;
end;
$$ language plpgsql security definer;

-- Function to add audit log entry
create or replace function add_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id text default null,
  p_old_value jsonb default null,
  p_new_value jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  audit_id uuid;
  current_tenant_id uuid;
  current_user_id uuid;
begin
  current_tenant_id := get_current_tenant();
  current_user_id := auth.uid();
  
  if current_tenant_id is null then
    raise exception 'Cannot create audit log without tenant context';
  end if;
  
  insert into audit_logs (
    tenant_id, user_id, action, resource_type, resource_id, 
    old_value, new_value, metadata
  )
  values (
    current_tenant_id, current_user_id, p_action, p_resource_type, p_resource_id,
    p_old_value, p_new_value, p_metadata
  )
  returning id into audit_id;
  
  return audit_id;
end;
$$ language plpgsql security definer;

-- Add realtime subscriptions for new tables
alter publication supabase_realtime add table tenants;
alter publication supabase_realtime add table audit_logs;
alter publication supabase_realtime add table connector_events;
alter publication supabase_realtime add table analytics_events;