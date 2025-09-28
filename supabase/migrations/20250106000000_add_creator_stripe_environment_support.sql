/**
 * CREATOR STRIPE ENVIRONMENT SUPPORT
 * Extends creator_profiles to support separate test and production Stripe credentials
 * for enhanced creator onboarding flow with environment management
 */

-- Add environment-specific Stripe credentials to creator_profiles
alter table creator_profiles add column if not exists stripe_test_account_id text;
alter table creator_profiles add column if not exists stripe_test_access_token text;
alter table creator_profiles add column if not exists stripe_test_refresh_token text;
alter table creator_profiles add column if not exists stripe_test_enabled boolean default false;

alter table creator_profiles add column if not exists stripe_production_account_id text;
alter table creator_profiles add column if not exists stripe_production_access_token text;
alter table creator_profiles add column if not exists stripe_production_refresh_token text;
alter table creator_profiles add column if not exists stripe_production_enabled boolean default false;

-- Add current environment preference
alter table creator_profiles add column if not exists current_stripe_environment text default 'test' check (current_stripe_environment in ('test', 'production'));

-- Add go-live status tracking
alter table creator_profiles add column if not exists production_ready boolean default false;
alter table creator_profiles add column if not exists production_launched_at timestamp with time zone;

-- Create indexes for better performance
create index if not exists idx_creator_profiles_test_stripe on creator_profiles(stripe_test_account_id) where stripe_test_account_id is not null;
create index if not exists idx_creator_profiles_production_stripe on creator_profiles(stripe_production_account_id) where stripe_production_account_id is not null;
create index if not exists idx_creator_profiles_environment on creator_profiles(current_stripe_environment);

-- Migration of existing single Stripe credentials to test environment
-- This ensures backward compatibility
update creator_profiles 
set 
  stripe_test_account_id = stripe_account_id,
  stripe_test_enabled = stripe_account_enabled,
  current_stripe_environment = 'test'
where stripe_account_id is not null 
  and stripe_test_account_id is null;

-- Comment for future reference
comment on column creator_profiles.stripe_test_account_id is 'Stripe account ID for test environment';
comment on column creator_profiles.stripe_production_account_id is 'Stripe account ID for production environment';
comment on column creator_profiles.current_stripe_environment is 'Currently active Stripe environment (test or production)';
comment on column creator_profiles.production_ready is 'Whether creator has completed requirements for production launch';
comment on column creator_profiles.production_launched_at is 'Timestamp when creator went live with production environment';