/**
* ADD EXTRACTED BRANDING DATA FIELDS
* Note: Adds fields to store extracted design tokens and branding data from URLs
*/

-- Add columns for extracted branding data
alter table creator_profiles 
  add column extracted_branding_data jsonb,
  add column branding_extraction_status text check (branding_extraction_status in ('pending', 'processing', 'completed', 'failed')) default null,
  add column branding_extraction_error text,
  add column branding_extracted_at timestamp with time zone;

-- Add comment for documentation
comment on column creator_profiles.extracted_branding_data is 'Stores extracted branding data: colors, fonts, design tokens, etc. from business website';
comment on column creator_profiles.branding_extraction_status is 'Status of the background branding extraction process';
comment on column creator_profiles.branding_extraction_error is 'Error message if branding extraction failed';
comment on column creator_profiles.branding_extracted_at is 'Timestamp when branding extraction was completed';

-- Create index for querying extraction status
create index idx_creator_profiles_extraction_status on creator_profiles(branding_extraction_status);
