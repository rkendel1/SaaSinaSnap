-- Remove the trigger that attempts to set tenant_id on platform_settings
DROP TRIGGER IF EXISTS set_platform_settings_tenant_id_trigger ON public.platform_settings;

-- Drop the function that is no longer needed
DROP FUNCTION IF EXISTS public.set_platform_settings_tenant_id();