create table platform_settings (
  id uuid not null primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  platform_owner_onboarding_completed boolean default false,
  default_creator_brand_color text,
  default_creator_gradient jsonb,
  default_creator_pattern jsonb,
  default_white_labeled_page_config jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table platform_settings enable row level security;

create policy "Allow authenticated users to read platform settings"
on platform_settings for select
using ( auth.role() = 'authenticated' );

create policy "Allow platform owner to update platform settings"
on platform_settings for update
using ( auth.uid() = owner_id );