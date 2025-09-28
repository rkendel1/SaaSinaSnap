/**
 * ENHANCED SUBSCRIPTION AND PRODUCT MANAGEMENT
 * Adds product approval workflow and enhanced creator role assignment
 */

-- Add tenant_id to subscriptions table if not exists
alter table subscriptions add column if not exists tenant_id uuid references tenants(id);
create index if not exists idx_subscriptions_tenant_id on subscriptions(tenant_id);

-- Add approval status and platform ownership fields to existing tables
alter table products add column if not exists approved boolean default false;
alter table products add column if not exists is_platform_product boolean default false;
alter table products add column if not exists platform_owner_id uuid references auth.users(id);

alter table creator_products add column if not exists approved boolean default false;
alter table creator_products add column if not exists is_platform_product boolean default false;
alter table creator_products add column if not exists platform_owner_id uuid references auth.users(id);

-- Create indexes for efficient queries on new fields
create index if not exists idx_products_approved on products(approved);
create index if not exists idx_products_platform on products(is_platform_product);
create index if not exists idx_products_platform_owner on products(platform_owner_id);

create index if not exists idx_creator_products_approved on creator_products(approved);
create index if not exists idx_creator_products_platform on creator_products(is_platform_product);
create index if not exists idx_creator_products_platform_owner on creator_products(platform_owner_id);

-- Update RLS policies for products to include approval logic
drop policy if exists "Public can view active products." on products;
create policy "Public can view approved active products." on products 
  for select using (active = true and approved = true);

-- Add policy for platform owners to manage all products
create policy "Platform owners can manage all products." on products 
  for all using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role = 'platform_owner'
    )
  );

-- Add policy for creators to manage their own products (but not approve them)
create policy "Creators can manage their own products." on products 
  for all using (
    exists (
      select 1 from creator_profiles 
      where creator_profiles.id = auth.uid()
    ) and not is_platform_product
  );

-- Update creator_products RLS policies similarly
drop policy if exists "Public can view active products." on creator_products;
create policy "Public can view approved active products." on creator_products 
  for select using (active = true and approved = true);

-- Add policy for platform owners to manage all creator products
create policy "Platform owners can manage all creator products." on creator_products 
  for all using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role = 'platform_owner'
    )
  );

-- Create subscription success tracking table
create table if not exists subscription_success_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  subscription_id text not null,
  stripe_session_id text not null,
  product_id text,
  price_id text,
  role_assigned user_role,
  creator_profile_created boolean default false,
  onboarding_redirected boolean default false,
  tenant_id uuid references tenants(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table subscription_success_events enable row level security;
create policy "Users can view their own subscription events." on subscription_success_events 
  for select using (auth.uid() = user_id);

create policy "Platform owners can view all subscription events." on subscription_success_events 
  for select using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role = 'platform_owner'
    )
  );

-- Add indexes for efficient queries
create index idx_subscription_success_events_user_id on subscription_success_events(user_id);
create index idx_subscription_success_events_subscription_id on subscription_success_events(subscription_id);
create index idx_subscription_success_events_session_id on subscription_success_events(stripe_session_id);
create index idx_subscription_success_events_tenant_id on subscription_success_events(tenant_id);

-- Add update trigger
create trigger update_subscription_success_events_updated_at before update on subscription_success_events 
  for each row execute procedure update_updated_at_column();

-- Function to automatically assign creator role on subscription
create or replace function assign_creator_role_on_subscription()
returns trigger as $$
begin
  -- Only proceed if this is a new active/trialing subscription
  if NEW.status in ('active', 'trialing') and (OLD is null or OLD.status != NEW.status) then
    -- Update user role to creator if not already a platform owner
    update users 
    set role = 'creator',
        updated_at = now()
    where id = NEW.user_id 
    and role not in ('platform_owner');
    
    -- Create creator profile if it doesn't exist
    insert into creator_profiles (
      id, 
      business_name, 
      onboarding_completed, 
      onboarding_step,
      tenant_id,
      created_at,
      updated_at
    )
    values (
      NEW.user_id,
      'New Creator Business',
      false,
      1,
      NEW.tenant_id,
      now(),
      now()
    )
    on conflict (id) do nothing;
    
    -- Log the subscription success event
    insert into subscription_success_events (
      user_id,
      subscription_id,
      stripe_session_id,
      role_assigned,
      creator_profile_created,
      tenant_id,
      metadata
    )
    values (
      NEW.user_id,
      NEW.id,
      coalesce(NEW.metadata->>'stripe_session_id', 'unknown'),
      'creator',
      true,
      NEW.tenant_id,
      jsonb_build_object(
        'subscription_status', NEW.status,
        'subscription_created_at', NEW.created_at
      )
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Add trigger to subscriptions table
drop trigger if exists assign_creator_role_trigger on subscriptions;
create trigger assign_creator_role_trigger
  after insert or update on subscriptions
  for each row execute function assign_creator_role_on_subscription();

-- Add realtime subscriptions for new tables
alter publication supabase_realtime add table subscription_success_events;