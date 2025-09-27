/**
 * FILE UPLOAD AND STORAGE SUPPORT
 * Note: This migration adds storage bucket configuration and policies
 * for secure file uploads (logos, assets, etc.)
 */

-- Create storage bucket for creator assets
insert into storage.buckets (id, name, public)
values ('creator-assets', 'creator-assets', true);

-- Enable RLS on the bucket
update storage.buckets set public = true where id = 'creator-assets';

-- Create storage policies for creator assets
create policy "Users can upload their own creator assets"
on storage.objects for insert
with check (bucket_id = 'creator-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view creator assets"
on storage.objects for select
using (bucket_id = 'creator-assets');

create policy "Users can update their own creator assets"
on storage.objects for update
using (bucket_id = 'creator-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own creator assets"
on storage.objects for delete
using (bucket_id = 'creator-assets' and auth.uid()::text = (storage.foldername(name))[1]);

/**
 * ENHANCED HEADER GENERATION SUPPORT
 * Note: Add tables to store site analysis and header generation data
 */

-- Table to store site analysis results
create table site_analysis (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references creator_profiles(id) not null,
  source_url text not null,
  analysis_data jsonb not null default '{}'::jsonb,
  extraction_status text check (extraction_status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  confidence_score decimal(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  elements_found text[] default array[]::text[],
  error_message text,
  tenant_id uuid references tenants(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table site_analysis enable row level security;
create policy "Creators can manage their own site analysis." on site_analysis for all using (auth.uid() = creator_id);

-- Table to store generated headers with their metadata
create table generated_headers (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references creator_profiles(id) not null,
  site_analysis_id uuid references site_analysis(id),
  header_html text not null,
  header_css text not null default '',
  brand_alignment_score decimal(3,2) check (brand_alignment_score >= 0 and brand_alignment_score <= 1),
  customizations jsonb not null default '{}'::jsonb,
  white_label_links jsonb not null default '{}'::jsonb,
  generation_metadata jsonb not null default '{}'::jsonb,
  active boolean default true,
  tenant_id uuid references tenants(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table generated_headers enable row level security;
create policy "Creators can manage their own generated headers." on generated_headers for all using (auth.uid() = creator_id);
create policy "Public can view active generated headers." on generated_headers for select using (active = true);

-- Add indexes for efficient queries
create index idx_site_analysis_creator_id on site_analysis(creator_id);
create index idx_site_analysis_status on site_analysis(extraction_status);
create index idx_generated_headers_creator_id on generated_headers(creator_id);
create index idx_generated_headers_active on generated_headers(active);

-- Add file path fields to creator_profiles for uploaded assets
alter table creator_profiles add column business_logo_file_path text;
alter table creator_profiles add column uploaded_assets jsonb default '{}'::jsonb;

-- Create trigger to update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_site_analysis_updated_at
  before update on site_analysis
  for each row execute function update_updated_at_column();

create trigger update_generated_headers_updated_at
  before update on generated_headers
  for each row execute function update_updated_at_column();