/**
 * REMOVE BRANDING AND COLOR CONFIGURATION FIELDS
 * Removes default creator branding and white-labeled page configuration
 * fields from platform_settings table as these are no longer part of onboarding
 */

-- Remove branding-related columns from platform_settings table
ALTER TABLE platform_settings DROP COLUMN IF EXISTS default_creator_brand_color;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS default_creator_gradient;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS default_creator_pattern;
ALTER TABLE platform_settings DROP COLUMN IF EXISTS default_white_labeled_page_config;
