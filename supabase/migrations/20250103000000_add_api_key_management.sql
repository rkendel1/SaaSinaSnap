/**
 * COMPREHENSIVE API KEY MANAGEMENT SYSTEM
 * This migration adds full-featured API key management for SaaS creators and their customers
 */

-- API Keys table for storing all generated API keys with comprehensive metadata
create table api_keys (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  
  -- Multi-tenant support
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Key identification
  key_prefix text not null, -- e.g., 'sk_test_', 'sk_live_', 'sk_restricted_'
  key_hash text not null unique, -- Hashed version of the full key for security
  key_hint text not null, -- Last 4 characters for display purposes
  
  -- Ownership and context
  creator_id uuid not null, -- The SaaS creator who owns this key
  customer_id uuid, -- The end customer (if generated for a specific customer)
  user_id uuid references auth.users(id), -- The user who generated/owns the key
  
  -- Key configuration
  name text not null, -- User-friendly name for the key
  description text, -- Optional description
  environment text not null check (environment in ('test', 'production', 'sandbox')),
  
  -- Permissions and scoping
  scopes text[] not null default array[]::text[], -- Array of permitted scopes
  permissions jsonb default '{}'::jsonb, -- Detailed permissions configuration
  
  -- Usage limits and rate limiting
  rate_limit_per_hour integer default 1000,
  rate_limit_per_day integer default 10000,
  rate_limit_per_month integer default 100000,
  usage_limits jsonb default '{}'::jsonb, -- Custom usage limits per feature
  
  -- Security and lifecycle
  expires_at timestamp with time zone, -- Optional expiration
  last_used_at timestamp with time zone, -- Track last usage
  last_used_ip inet, -- Track last IP for security
  usage_count bigint default 0, -- Total usage counter
  
  -- Status management
  active boolean default true,
  revoked_at timestamp with time zone,
  revoked_by uuid references auth.users(id),
  revoked_reason text,
  
  -- Auto-rotation support
  auto_rotate_enabled boolean default false,
  rotate_every_days integer default 90,
  next_rotation_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for security
alter table api_keys enable row level security;

-- Indexes for performance
create index idx_api_keys_tenant_id on api_keys(tenant_id);
create index idx_api_keys_creator_id on api_keys(creator_id);
create index idx_api_keys_customer_id on api_keys(customer_id) where customer_id is not null;
create index idx_api_keys_user_id on api_keys(user_id);
create index idx_api_keys_key_hash on api_keys(key_hash);
create index idx_api_keys_environment on api_keys(environment);
create index idx_api_keys_active on api_keys(active);
create index idx_api_keys_expires_at on api_keys(expires_at) where expires_at is not null;

-- RLS policies
create policy "Users can manage their own API keys" on api_keys 
  for all using (auth.uid() = user_id);

create policy "Creators can manage keys for their products" on api_keys
  for all using (auth.uid() = creator_id);

-- API Key Usage Logs for detailed tracking and analytics
create table api_key_usage (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  
  -- Multi-tenant support
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Key reference
  api_key_id uuid references api_keys(id) on delete cascade not null,
  
  -- Request details
  endpoint text not null,
  method text not null,
  status_code integer not null,
  response_time_ms integer,
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  referer text,
  
  -- Usage tracking
  tokens_used bigint default 0,
  credits_consumed decimal(10,4) default 0,
  
  -- Timestamps
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table api_key_usage enable row level security;

-- Indexes for analytics queries
create index idx_api_key_usage_tenant_id on api_key_usage(tenant_id);
create index idx_api_key_usage_api_key_id on api_key_usage(api_key_id);
create index idx_api_key_usage_timestamp on api_key_usage(timestamp);
create index idx_api_key_usage_endpoint on api_key_usage(endpoint);
create index idx_api_key_usage_status_code on api_key_usage(status_code);

-- RLS policies for usage logs
create policy "Users can view usage logs for their API keys" on api_key_usage
  for select using (
    exists (
      select 1 from api_keys 
      where api_keys.id = api_key_usage.api_key_id 
      and api_keys.user_id = auth.uid()
    )
  );

create policy "Creators can view usage logs for their keys" on api_key_usage
  for select using (
    exists (
      select 1 from api_keys 
      where api_keys.id = api_key_usage.api_key_id 
      and api_keys.creator_id = auth.uid()
    )
  );

-- Creator API Key Configuration - Define key requirements per creator/product
create table creator_api_key_configs (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  
  -- Multi-tenant support
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Creator reference
  creator_id uuid not null,
  
  -- Configuration
  requires_api_keys boolean default false, -- Whether this creator's products require API keys
  delegate_key_management boolean default true, -- Let platform handle key management
  
  -- Default key settings
  default_environment text default 'test' check (default_environment in ('test', 'production', 'sandbox')),
  default_rate_limit_per_hour integer default 1000,
  default_rate_limit_per_day integer default 10000,
  default_rate_limit_per_month integer default 100000,
  
  -- Available scopes for this creator
  available_scopes text[] default array['read:basic']::text[],
  default_scopes text[] default array['read:basic']::text[],
  
  -- Expiration policies
  default_expires_days integer, -- null means no expiration
  allow_customer_key_regeneration boolean default true,
  allow_customer_scope_modification boolean default false,
  
  -- Auto-delivery settings
  auto_generate_on_purchase boolean default true,
  email_keys_to_customers boolean default true,
  include_in_dashboard boolean default true,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint per creator
  unique(creator_id, tenant_id)
);

-- Enable RLS
alter table creator_api_key_configs enable row level security;

-- Indexes
create index idx_creator_api_key_configs_tenant_id on creator_api_key_configs(tenant_id);
create index idx_creator_api_key_configs_creator_id on creator_api_key_configs(creator_id);

-- RLS policies
create policy "Creators can manage their own API key configurations" on creator_api_key_configs
  for all using (auth.uid() = creator_id);

-- API Key Rotation History for audit trail
create table api_key_rotations (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  
  -- Multi-tenant support
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Key reference
  api_key_id uuid references api_keys(id) on delete cascade not null,
  
  -- Rotation details
  old_key_hash text not null,
  new_key_hash text not null,
  rotation_type text not null check (rotation_type in ('manual', 'auto', 'security')),
  reason text,
  
  -- Actor
  rotated_by uuid references auth.users(id),
  
  -- Timestamps
  rotated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table api_key_rotations enable row level security;

-- Indexes
create index idx_api_key_rotations_tenant_id on api_key_rotations(tenant_id);
create index idx_api_key_rotations_api_key_id on api_key_rotations(api_key_id);
create index idx_api_key_rotations_rotated_at on api_key_rotations(rotated_at);

-- RLS policies
create policy "Users can view rotations for their API keys" on api_key_rotations
  for select using (
    exists (
      select 1 from api_keys 
      where api_keys.id = api_key_rotations.api_key_id 
      and api_keys.user_id = auth.uid()
    )
  );

-- Functions for API key management

-- Function to generate a secure API key hash
create or replace function generate_api_key_hash(key_value text)
returns text as $$
begin
  return encode(digest(key_value, 'sha256'), 'hex');
end;
$$ language plpgsql security definer;

-- Function to update API key last used timestamp
create or replace function update_api_key_usage(key_hash text, ip_addr inet default null)
returns void as $$
begin
  update api_keys 
  set 
    last_used_at = now(),
    last_used_ip = coalesce(ip_addr, last_used_ip),
    usage_count = usage_count + 1,
    updated_at = now()
  where api_keys.key_hash = key_hash;
end;
$$ language plpgsql security definer;

-- Function to check if API key is valid and active
create or replace function is_api_key_valid(key_hash text)
returns boolean as $$
declare
  key_record record;
begin
  select * into key_record 
  from api_keys 
  where api_keys.key_hash = key_hash
  and active = true
  and revoked_at is null
  and (expires_at is null or expires_at > now());
  
  return found;
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_api_keys_updated_at 
  before update on api_keys 
  for each row execute function update_updated_at_column();

create trigger update_creator_api_key_configs_updated_at 
  before update on creator_api_key_configs 
  for each row execute function update_updated_at_column();