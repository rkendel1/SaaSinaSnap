/**
* CREATOR PROFILES
* Note: This table contains creator-specific data for SaaS creators
*/
create table creator_profiles (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  -- Creator business information
  business_name text,
  business_description text,
  business_website text,
  business_logo_url text,
  -- Stripe Connect account information
  stripe_account_id text,
  stripe_account_enabled boolean default false,
  -- Onboarding status
  onboarding_completed boolean default false,
  onboarding_step integer default 1,
  -- Creator settings
  brand_color text,
  custom_domain text,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table creator_profiles enable row level security;
create policy "Can view own creator profile." on creator_profiles for select using (auth.uid() = id);
create policy "Can update own creator profile." on creator_profiles for update using (auth.uid() = id);
create policy "Can insert own creator profile." on creator_profiles for insert with check (auth.uid() = id);

/**
* CREATOR PRODUCTS
* Note: Products managed by creators for their SaaS offerings
*/
create table creator_products (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Product information
  name text not null,
  description text,
  price decimal(10,2),
  currency text check (char_length(currency) = 3) default 'usd',
  -- Product type and configuration
  product_type text check (product_type in ('one_time', 'subscription', 'usage_based')),
  stripe_product_id text,
  stripe_price_id text,
  -- Product settings
  active boolean default true,
  featured boolean default false,
  -- Metadata
  metadata jsonb,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table creator_products enable row level security;
create policy "Creators can manage their own products." on creator_products for all using (auth.uid() = creator_id);
create policy "Public can view active products." on creator_products for select using (active = true);

/**
* WHITE LABELED PAGES
* Note: Custom pages generated for each creator
*/
create table white_labeled_pages (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Page configuration
  page_slug text not null,
  page_title text,
  page_description text,
  -- Page content and styling
  page_config jsonb,
  custom_css text,
  -- Page settings
  active boolean default true,
  -- SEO settings
  meta_title text,
  meta_description text,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Unique constraint on creator_id and page_slug
  unique(creator_id, page_slug)
);

alter table white_labeled_pages enable row level security;
create policy "Creators can manage their own pages." on white_labeled_pages for all using (auth.uid() = creator_id);
create policy "Public can view active pages." on white_labeled_pages for select using (active = true);

/**
* CREATOR WEBHOOKS
* Note: Webhook endpoints for creator-specific events
*/
create table creator_webhooks (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Webhook configuration
  endpoint_url text not null,
  events text[] not null,
  secret_key text,
  -- Webhook status
  active boolean default true,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table creator_webhooks enable row level security;
create policy "Creators can manage their own webhooks." on creator_webhooks for all using (auth.uid() = creator_id);

/**
* CREATOR ANALYTICS
* Note: Analytics data for creator performance tracking
*/
create table creator_analytics (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Analytics data
  metric_name text not null,
  metric_value decimal(15,2),
  metric_data jsonb,
  -- Time period
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table creator_analytics enable row level security;
create policy "Creators can view their own analytics." on creator_analytics for select using (auth.uid() = creator_id);

/**
* Update function for updated_at timestamps
*/
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_creator_profiles_updated_at before update on creator_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_creator_products_updated_at before update on creator_products
  for each row execute procedure update_updated_at_column();

create trigger update_white_labeled_pages_updated_at before update on white_labeled_pages
  for each row execute procedure update_updated_at_column();

create trigger update_creator_webhooks_updated_at before update on creator_webhooks
  for each row execute procedure update_updated_at_column();

/**
* REALTIME SUBSCRIPTIONS
* Add new tables to realtime publication
*/
alter publication supabase_realtime add table creator_profiles;
alter publication supabase_realtime add table creator_products;
alter publication supabase_realtime add table white_labeled_pages;