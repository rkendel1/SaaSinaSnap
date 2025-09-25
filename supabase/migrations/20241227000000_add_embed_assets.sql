/**
* EMBED ASSETS
* Note: Asset library for creators to manage and share their embed assets
*/
create table embed_assets (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Creator reference
  creator_id uuid references creator_profiles(id) not null,
  -- Asset information
  name text not null,
  description text,
  asset_type text check (asset_type in ('product_card', 'checkout_button', 'pricing_table', 'custom')) not null,
  -- Asset configuration
  embed_config jsonb not null,
  preview_url text,
  -- Asset settings
  active boolean default true,
  is_public boolean default false,
  featured boolean default false,
  -- Sharing settings
  share_token text unique,
  share_enabled boolean default false,
  -- Usage tracking
  view_count integer default 0,
  usage_count integer default 0,
  -- Metadata
  tags text[],
  metadata jsonb,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table embed_assets enable row level security;
create policy "Creators can manage their own assets." on embed_assets for all using (auth.uid() = creator_id);
create policy "Public can view shared assets." on embed_assets for select using (is_public = true OR share_enabled = true);

-- Add trigger for updated_at
create trigger update_embed_assets_updated_at before update on embed_assets
  for each row execute procedure update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_embed_assets_creator_active ON embed_assets(creator_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_embed_assets_type ON embed_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_embed_assets_share_token ON embed_assets(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_embed_assets_public ON embed_assets(is_public) WHERE is_public = true;

-- Add to realtime publication
alter publication supabase_realtime add table embed_assets;

/**
* ASSET SHARING LOGS
* Note: Track when assets are accessed via sharing
*/
create table asset_sharing_logs (
  -- UUID primary key
  id uuid default gen_random_uuid() primary key,
  -- Asset reference
  asset_id uuid references embed_assets(id) not null,
  -- Access information
  accessed_by_ip text,
  accessed_by_user_agent text,
  referrer_url text,
  -- Timestamps
  accessed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table asset_sharing_logs enable row level security;
create policy "Creators can view logs for their assets." on asset_sharing_logs 
  for select using (
    exists (
      select 1 from embed_assets ea 
      where ea.id = asset_sharing_logs.asset_id and ea.creator_id = auth.uid()
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_asset_sharing_logs_asset_time ON asset_sharing_logs(asset_id, accessed_at);