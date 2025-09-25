/**
 * USAGE TRACKING AND METERED BILLING
 * Note: This migration adds tables for usage tracking, meter definitions, and billing enforcement
 */

/**
 * USAGE METERS
 * Note: Defines the different types of usage metrics that can be tracked
 */
create table usage_meters (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Meter configuration
  event_name text not null,
  display_name text not null,
  description text,
  aggregation_type text not null check (aggregation_type in ('count', 'sum', 'unique', 'duration', 'max')),
  unit_name text default 'units',
  -- Billing configuration
  billing_model text not null check (billing_model in ('metered', 'licensed', 'hybrid')) default 'metered',
  -- Status
  active boolean default true,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint on creator_id and event_name
  unique(creator_id, event_name)
);

alter table usage_meters enable row level security;
create policy "Creators can manage their own meters." on usage_meters for all using (auth.uid() = creator_id);

/**
 * METER PLAN LIMITS
 * Note: Defines usage limits for each meter per subscription plan
 */
create table meter_plan_limits (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Meter reference
  meter_id uuid references usage_meters(id) on delete cascade not null,
  -- Plan configuration
  plan_name text not null,
  -- Limit configuration
  limit_value bigint, -- null means unlimited
  overage_price decimal(10,4), -- price per unit over limit
  soft_limit_threshold decimal(3,2) default 0.8, -- percentage for warnings (e.g., 0.8 = 80%)
  -- Enforcement
  hard_cap boolean default false, -- block usage when limit reached
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint on meter_id and plan_name
  unique(meter_id, plan_name)
);

alter table meter_plan_limits enable row level security;
create policy "Creators can manage limits for their own meters." on meter_plan_limits 
  for all using (exists (
    select 1 from usage_meters where usage_meters.id = meter_plan_limits.meter_id 
    and usage_meters.creator_id = auth.uid()
  ));

/**
 * USAGE EVENTS
 * Note: Raw usage events tracked by the system
 */
create table usage_events (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Meter reference
  meter_id uuid references usage_meters(id) on delete cascade not null,
  -- Event data
  user_id text not null, -- the end-user/customer ID
  event_value numeric not null default 1, -- the value to aggregate (count, sum, etc.)
  properties jsonb, -- additional event properties
  -- Timestamps
  event_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for efficient queries
create index idx_usage_events_meter_user_time on usage_events(meter_id, user_id, event_timestamp);
create index idx_usage_events_timestamp on usage_events(event_timestamp);

alter table usage_events enable row level security;
create policy "Creators can view events for their own meters." on usage_events 
  for select using (exists (
    select 1 from usage_meters where usage_meters.id = usage_events.meter_id 
    and usage_meters.creator_id = auth.uid()
  ));

/**
 * USAGE AGGREGATES
 * Note: Pre-computed usage aggregates for performance
 */
create table usage_aggregates (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Meter reference
  meter_id uuid references usage_meters(id) on delete cascade not null,
  -- Aggregation scope
  user_id text not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  -- Aggregate data
  aggregate_value numeric not null,
  event_count bigint not null default 0,
  -- Billing period
  billing_period text, -- e.g., "2024-01", "2024-01-15" for different billing cycles
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint
  unique(meter_id, user_id, period_start, period_end)
);

-- Index for efficient queries
create index idx_usage_aggregates_meter_user_period on usage_aggregates(meter_id, user_id, billing_period);

alter table usage_aggregates enable row level security;
create policy "Creators can view aggregates for their own meters." on usage_aggregates 
  for select using (exists (
    select 1 from usage_meters where usage_meters.id = usage_aggregates.meter_id 
    and usage_meters.creator_id = auth.uid()
  ));

/**
 * USAGE ALERTS
 * Note: Tracks usage limit alerts and notifications
 */
create table usage_alerts (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Meter reference
  meter_id uuid references usage_meters(id) on delete cascade not null,
  -- Alert scope
  user_id text not null,
  plan_name text not null,
  -- Alert data
  alert_type text not null check (alert_type in ('soft_limit', 'hard_limit', 'overage')),
  threshold_percentage decimal(5,2), -- percentage of limit reached
  current_usage numeric not null,
  limit_value bigint,
  -- Alert status
  triggered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  acknowledged boolean default false,
  acknowledged_at timestamp with time zone,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for efficient queries
create index idx_usage_alerts_meter_user on usage_alerts(meter_id, user_id);
create index idx_usage_alerts_triggered on usage_alerts(triggered_at) where not acknowledged;

alter table usage_alerts enable row level security;
create policy "Creators can view alerts for their own meters." on usage_alerts 
  for all using (exists (
    select 1 from usage_meters where usage_meters.id = usage_alerts.meter_id 
    and usage_meters.creator_id = auth.uid()
  ));

/**
 * USAGE BILLING SYNC
 * Note: Tracks synchronization with external billing systems (like Stripe)
 */
create table usage_billing_sync (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Meter reference
  meter_id uuid references usage_meters(id) on delete cascade not null,
  -- Sync scope
  user_id text not null,
  billing_period text not null,
  -- Usage data
  usage_quantity numeric not null,
  overage_quantity numeric default 0,
  -- External billing data
  stripe_usage_record_id text,
  stripe_subscription_item_id text,
  billing_status text default 'pending' check (billing_status in ('pending', 'synced', 'failed')),
  -- Sync metadata
  sync_attempts integer default 0,
  last_sync_attempt timestamp with time zone,
  sync_error text,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint
  unique(meter_id, user_id, billing_period)
);

-- Index for efficient queries
create index idx_usage_billing_sync_status on usage_billing_sync(billing_status);

alter table usage_billing_sync enable row level security;
create policy "Creators can view billing sync for their own meters." on usage_billing_sync 
  for all using (exists (
    select 1 from usage_meters where usage_meters.id = usage_billing_sync.meter_id 
    and usage_meters.creator_id = auth.uid()
  ));

-- Update timestamp triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_usage_meters_updated_at before update on usage_meters for each row execute procedure update_updated_at_column();
create trigger update_meter_plan_limits_updated_at before update on meter_plan_limits for each row execute procedure update_updated_at_column();
create trigger update_usage_aggregates_updated_at before update on usage_aggregates for each row execute procedure update_updated_at_column();
create trigger update_usage_billing_sync_updated_at before update on usage_billing_sync for each row execute procedure update_updated_at_column();