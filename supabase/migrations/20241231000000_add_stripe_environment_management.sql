/**
 * TENANT-AWARE STRIPE ENVIRONMENT MANAGEMENT
 * Adds support for test/production Stripe environments per tenant
 * with secure credential management and one-click deployment capability
 */

-- First, add tenant_id to platform_settings table to make it tenant-aware
alter table platform_settings add column tenant_id uuid references tenants(id);
create index idx_platform_settings_tenant_id on platform_settings(tenant_id);

-- Add Stripe environment configuration columns to platform_settings
alter table platform_settings add column stripe_environment text default 'test' check (stripe_environment in ('test', 'production'));
alter table platform_settings add column stripe_test_account_id text;
alter table platform_settings add column stripe_test_access_token text;
alter table platform_settings add column stripe_test_refresh_token text;
alter table platform_settings add column stripe_production_account_id text;
alter table platform_settings add column stripe_production_access_token text;
alter table platform_settings add column stripe_production_refresh_token text;
alter table platform_settings add column stripe_test_enabled boolean default false;
alter table platform_settings add column stripe_production_enabled boolean default false;

-- Update RLS policies for platform_settings to be tenant-aware
drop policy if exists "Allow authenticated users to read platform settings" on platform_settings;
drop policy if exists "Allow platform owner to update platform settings" on platform_settings;

create policy "Tenant isolation for platform settings." on platform_settings 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

-- Create stripe_environment_configs table for detailed environment management
create table stripe_environment_configs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  environment text not null check (environment in ('test', 'production')),
  stripe_account_id text,
  stripe_access_token text,
  stripe_refresh_token text,
  stripe_publishable_key text,
  is_active boolean default false,
  webhook_endpoint_id text,
  webhook_secret text,
  last_synced_at timestamp with time zone,
  sync_status text default 'pending' check (sync_status in ('pending', 'syncing', 'synced', 'failed')),
  sync_error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, environment)
);

alter table stripe_environment_configs enable row level security;
create policy "Tenant isolation for stripe environment configs." on stripe_environment_configs 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

create index idx_stripe_environment_configs_tenant_id on stripe_environment_configs(tenant_id);
create index idx_stripe_environment_configs_environment on stripe_environment_configs(tenant_id, environment);

-- Create product_environment_deployments table to track product deployments between environments
create table product_environment_deployments (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  product_id uuid not null, -- references creator_products.id
  source_environment text not null check (source_environment in ('test', 'production')),
  target_environment text not null check (target_environment in ('test', 'production')),
  source_stripe_product_id text,
  target_stripe_product_id text,
  source_stripe_price_id text,
  target_stripe_price_id text,
  deployment_status text default 'pending' check (deployment_status in ('pending', 'deploying', 'completed', 'failed', 'rolled_back')),
  deployment_data jsonb default '{}'::jsonb,
  error_message text,
  deployed_by uuid references auth.users(id),
  deployed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table product_environment_deployments enable row level security;
create policy "Tenant isolation for product environment deployments." on product_environment_deployments 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

create index idx_product_environment_deployments_tenant_id on product_environment_deployments(tenant_id);
create index idx_product_environment_deployments_product on product_environment_deployments(product_id);
create index idx_product_environment_deployments_status on product_environment_deployments(deployment_status);

-- Create environment_sync_logs table for audit trail of environment operations
create table environment_sync_logs (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) not null,
  environment text not null check (environment in ('test', 'production')),
  operation text not null, -- 'product_sync', 'price_sync', 'webhook_setup', 'environment_switch', 'deployment'
  entity_type text, -- 'product', 'price', 'webhook', 'account'
  entity_id text, -- Stripe ID or internal ID
  operation_data jsonb default '{}'::jsonb,
  status text not null check (status in ('started', 'completed', 'failed')),
  error_message text,
  started_by uuid references auth.users(id),
  duration_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table environment_sync_logs enable row level security;
create policy "Tenant isolation for environment sync logs." on environment_sync_logs 
  for all using (tenant_id = current_setting('app.current_tenant')::uuid);

create index idx_environment_sync_logs_tenant_id on environment_sync_logs(tenant_id);
create index idx_environment_sync_logs_environment on environment_sync_logs(tenant_id, environment);
create index idx_environment_sync_logs_operation on environment_sync_logs(operation);
create index idx_environment_sync_logs_created_at on environment_sync_logs(created_at desc);

-- Add environment columns to creator_products for tracking which environment they belong to
alter table creator_products add column environment text default 'test' check (environment in ('test', 'production'));
alter table creator_products add column stripe_test_product_id text;
alter table creator_products add column stripe_test_price_id text;
alter table creator_products add column stripe_production_product_id text;
alter table creator_products add column stripe_production_price_id text;
alter table creator_products add column last_deployed_to_production timestamp with time zone;
alter table creator_products add column deployment_notes text;

-- Create indexes for the new columns
create index idx_creator_products_environment on creator_products(tenant_id, environment);
create index idx_creator_products_test_stripe on creator_products(stripe_test_product_id);
create index idx_creator_products_production_stripe on creator_products(stripe_production_product_id);

-- Function to automatically set tenant_id for new platform_settings records
create or replace function set_platform_settings_tenant_id()
returns trigger as $$
begin
  if NEW.tenant_id is null then
    -- Try to get tenant_id from current setting, fallback to a default or error
    begin
      NEW.tenant_id := current_setting('app.current_tenant')::uuid;
    exception when others then
      -- If no tenant context is set, we might need to handle this differently
      -- For now, we'll allow it to be null and handle it at the application level
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Create trigger for platform_settings
create trigger set_platform_settings_tenant_id_trigger
  before insert on platform_settings
  for each row execute function set_platform_settings_tenant_id();

-- Function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = timezone('utc'::text, now());
  return NEW;
end;
$$ language plpgsql;

-- Add updated_at triggers for new tables
create trigger update_stripe_environment_configs_updated_at
  before update on stripe_environment_configs
  for each row execute function update_updated_at_column();

create trigger update_product_environment_deployments_updated_at
  before update on product_environment_deployments
  for each row execute function update_updated_at_column();