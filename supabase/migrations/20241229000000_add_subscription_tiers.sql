/**
 * SUBSCRIPTION TIER MANAGEMENT
 * Note: This migration adds tables for managing subscription tiers, feature entitlements, and tier enforcement
 */

/**
 * SUBSCRIPTION TIERS
 * Note: Defines subscription tiers/plans that creators can offer to their customers
 */
create table subscription_tiers (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Tier configuration
  name text not null,
  description text,
  price decimal(10,2) not null,
  currency text check (char_length(currency) = 3) default 'usd',
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly', 'weekly', 'daily')) default 'monthly',
  -- Feature entitlements (JSON array of feature names/limits)
  feature_entitlements jsonb default '[]'::jsonb,
  -- Usage caps (JSON object with metric_name: limit_value pairs)
  usage_caps jsonb default '{}'::jsonb,
  -- Tier settings
  active boolean default true,
  is_default boolean default false,
  sort_order integer default 0,
  -- Stripe integration
  stripe_price_id text,
  stripe_product_id text,  
  -- Trial settings
  trial_period_days integer default 0,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint on creator_id and name
  unique(creator_id, name)
);

alter table subscription_tiers enable row level security;
create policy "Creators can manage their own tiers." on subscription_tiers for all using (auth.uid() = creator_id);
create policy "Public can view active tiers." on subscription_tiers for select using (active = true);

-- Index for efficient queries
create index idx_subscription_tiers_creator_active on subscription_tiers(creator_id, active);
create index idx_subscription_tiers_sort_order on subscription_tiers(creator_id, sort_order);

/**
 * CUSTOMER TIER ASSIGNMENTS
 * Note: Tracks which tier each customer is currently subscribed to
 */
create table customer_tier_assignments (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Customer and creator references
  customer_id uuid references auth.users not null,
  creator_id uuid references creator_profiles(id) not null,
  tier_id uuid references subscription_tiers(id) not null,
  -- Assignment details
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing', 'paused')) default 'active',
  -- Billing period tracking
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Trial information
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  -- Cancellation information
  cancel_at_period_end boolean default false,
  canceled_at timestamp with time zone,
  -- Stripe subscription reference
  stripe_subscription_id text,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint - one active assignment per customer per creator
  unique(customer_id, creator_id)
);

alter table customer_tier_assignments enable row level security;
create policy "Customers can view their own assignments." on customer_tier_assignments for select using (auth.uid() = customer_id);
create policy "Creators can view assignments for their tiers." on customer_tier_assignments for select using (auth.uid() = creator_id);
create policy "Creators can manage assignments for their tiers." on customer_tier_assignments for all using (auth.uid() = creator_id);

-- Index for efficient queries
create index idx_customer_tier_assignments_customer on customer_tier_assignments(customer_id, status);
create index idx_customer_tier_assignments_creator on customer_tier_assignments(creator_id, status);
create index idx_customer_tier_assignments_tier on customer_tier_assignments(tier_id, status);

/**
 * TIER USAGE OVERAGES
 * Note: Tracks usage overages beyond tier limits for billing purposes
 */
create table tier_usage_overages (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- References
  customer_id uuid references auth.users not null,
  creator_id uuid references creator_profiles(id) not null,
  tier_id uuid references subscription_tiers(id) not null,
  meter_id uuid references usage_meters(id) not null,
  -- Overage details
  billing_period text not null,
  limit_value bigint not null,
  actual_usage numeric not null,
  overage_amount numeric not null,
  overage_price decimal(10,4) not null,
  overage_cost decimal(10,2) not null,
  -- Billing status
  billed boolean default false,
  billed_at timestamp with time zone,
  stripe_invoice_item_id text,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint
  unique(customer_id, creator_id, meter_id, billing_period)
);

alter table tier_usage_overages enable row level security;
create policy "Customers can view their own overages." on tier_usage_overages for select using (auth.uid() = customer_id);
create policy "Creators can view overages for their customers." on tier_usage_overages for select using (auth.uid() = creator_id);
create policy "Creators can manage overages for their customers." on tier_usage_overages for all using (auth.uid() = creator_id);

-- Index for efficient queries
create index idx_tier_usage_overages_billing on tier_usage_overages(customer_id, billing_period, billed);
create index idx_tier_usage_overages_creator on tier_usage_overages(creator_id, billing_period);

/**
 * TIER ANALYTICS
 * Note: Pre-computed analytics for tier performance and usage patterns
 */
create table tier_analytics (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- References
  creator_id uuid references creator_profiles(id) not null,
  tier_id uuid references subscription_tiers(id) not null,
  -- Analytics period
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  period_type text not null check (period_type in ('daily', 'weekly', 'monthly', 'yearly')),
  -- Metrics
  active_customers integer default 0,
  new_customers integer default 0,
  churned_customers integer default 0,
  total_revenue decimal(10,2) default 0,
  overage_revenue decimal(10,2) default 0,
  average_usage_percentage decimal(5,2) default 0,
  -- Usage distribution
  usage_metrics jsonb default '{}'::jsonb,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint
  unique(creator_id, tier_id, period_start, period_type)
);

alter table tier_analytics enable row level security;
create policy "Creators can view analytics for their tiers." on tier_analytics for select using (auth.uid() = creator_id);

-- Index for efficient queries
create index idx_tier_analytics_creator_period on tier_analytics(creator_id, period_start, period_type);
create index idx_tier_analytics_tier_period on tier_analytics(tier_id, period_start, period_type);

-- Update timestamp triggers
create trigger update_subscription_tiers_updated_at before update on subscription_tiers for each row execute procedure update_updated_at_column();
create trigger update_customer_tier_assignments_updated_at before update on customer_tier_assignments for each row execute procedure update_updated_at_column();
create trigger update_tier_usage_overages_updated_at before update on tier_usage_overages for each row execute procedure update_updated_at_column();
create trigger update_tier_analytics_updated_at before update on tier_analytics for each row execute procedure update_updated_at_column();

-- Function to ensure only one default tier per creator
create or replace function ensure_single_default_tier()
returns trigger as $$
begin
  if new.is_default = true then
    -- Unset is_default for all other tiers by this creator
    update subscription_tiers 
    set is_default = false 
    where creator_id = new.creator_id 
    and id != new.id 
    and is_default = true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger ensure_single_default_tier_trigger
  before insert or update on subscription_tiers
  for each row
  when (new.is_default = true)
  execute function ensure_single_default_tier();

-- Function to get customer's current tier
create or replace function get_customer_current_tier(
  p_customer_id uuid,
  p_creator_id uuid
)
returns table (
  tier_id uuid,
  tier_name text,
  tier_price decimal,
  billing_cycle text,
  feature_entitlements jsonb,
  usage_caps jsonb,
  status text,
  current_period_end timestamp with time zone
) as $$
begin
  return query
  select 
    st.id as tier_id,
    st.name as tier_name,
    st.price as tier_price,
    st.billing_cycle,
    st.feature_entitlements,
    st.usage_caps,
    cta.status,
    cta.current_period_end
  from customer_tier_assignments cta
  join subscription_tiers st on st.id = cta.tier_id
  where cta.customer_id = p_customer_id
  and cta.creator_id = p_creator_id
  and cta.status in ('active', 'trialing', 'past_due')
  order by cta.created_at desc
  limit 1;
end;
$$ language plpgsql;

-- Function to check if customer has feature access
create or replace function customer_has_feature_access(
  p_customer_id uuid,
  p_creator_id uuid,
  p_feature_name text
)
returns boolean as $$
declare
  tier_features jsonb;
  feature_limit text;
begin
  -- Get customer's current tier features
  select feature_entitlements into tier_features
  from get_customer_current_tier(p_customer_id, p_creator_id);
  
  if tier_features is null then
    return false;
  end if;
  
  -- Check if feature exists in entitlements
  if tier_features ? p_feature_name then
    return true;
  end if;
  
  -- Check for features with limits (e.g., "team_seats:10")
  select value::text into feature_limit
  from jsonb_array_elements_text(tier_features)
  where value::text like p_feature_name || ':%';
  
  return feature_limit is not null;
end;
$$ language plpgsql;

-- Function to get customer's feature limit
create or replace function get_customer_feature_limit(
  p_customer_id uuid,
  p_creator_id uuid,
  p_feature_name text
)
returns integer as $$
declare
  tier_features jsonb;
  feature_limit text;
  limit_value integer;
begin
  -- Get customer's current tier features
  select feature_entitlements into tier_features
  from get_customer_current_tier(p_customer_id, p_creator_id);
  
  if tier_features is null then
    return 0;
  end if;
  
  -- Look for feature with limit (e.g., "team_seats:10")
  select value::text into feature_limit
  from jsonb_array_elements_text(tier_features)
  where value::text like p_feature_name || ':%';
  
  if feature_limit is not null then
    limit_value := split_part(feature_limit, ':', 2)::integer;
    return limit_value;
  end if;
  
  -- If feature exists without limit, return -1 (unlimited)
  if tier_features ? p_feature_name then
    return -1;
  end if;
  
  return 0;
end;
$$ language plpgsql;