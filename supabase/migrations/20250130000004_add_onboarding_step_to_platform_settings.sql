-- Add onboarding_step column to platform_settings table
ALTER TABLE public.platform_settings
ADD COLUMN onboarding_step INTEGER DEFAULT 1;

-- Update existing rows to set a default value if needed
UPDATE public.platform_settings
SET onboarding_step = 1
WHERE onboarding_step IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.platform_settings
ALTER COLUMN onboarding_step SET NOT NULL;