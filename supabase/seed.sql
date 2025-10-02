-- Add platform owner to creator_profiles if not present
INSERT INTO creator_profiles (
  id,
  business_name,
  business_description,
  business_website,
  business_logo_url,
  stripe_account_id,
  stripe_account_enabled,
  onboarding_completed,
  onboarding_step,
  brand_color,
  brand_gradient,
  brand_pattern,
  custom_domain,
  created_at,
  updated_at
)
SELECT
  '65eadc7c-1a2c-45f5-bdf7-399f5031d6aa',
  'Platform Owner',
  'Platform owner profile for asset creation',
  NULL,
  NULL,
  NULL,
  TRUE,
  TRUE,
  7,
  '#3b82f6',
  NULL,
  NULL,
  'platform-owner',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM creator_profiles WHERE id = '65eadc7c-1a2c-45f5-bdf7-399f5031d6aa'
);