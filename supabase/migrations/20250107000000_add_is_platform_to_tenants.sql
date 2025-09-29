-- Add is_platform column to tenants table
ALTER TABLE tenants ADD COLUMN is_platform BOOLEAN DEFAULT FALSE;

-- Update existing platform tenant (assuming the first tenant created is the platform tenant)
-- You might need to adjust the WHERE clause if your platform tenant is identified differently.
UPDATE tenants SET is_platform = TRUE WHERE id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1);

-- Ensure platform_settings table has a tenant_id column and link it to the platform tenant
-- This assumes platform_settings already exists.
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE platform_settings SET tenant_id = (SELECT id FROM tenants WHERE is_platform = TRUE LIMIT 1) WHERE tenant_id IS NULL;
ALTER TABLE platform_settings ALTER COLUMN tenant_id SET NOT NULL;

-- Create a constant for the platform tenant ID in the database
CREATE OR REPLACE FUNCTION public.get_platform_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
AS $function$
DECLARE
    platform_id UUID;
BEGIN
    SELECT id INTO platform_id FROM tenants WHERE is_platform = TRUE LIMIT 1;
    RETURN platform_id;
END;
$function$;

-- Update the set_current_tenant function to handle platform tenant ID
CREATE OR REPLACE FUNCTION public.set_current_tenant(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
  -- If tenant_uuid is NULL or the platform tenant ID, set app.current_tenant to the platform tenant ID
  IF tenant_uuid IS NULL OR tenant_uuid = public.get_platform_tenant_id() THEN
    PERFORM set_config('app.current_tenant', public.get_platform_tenant_id()::text, true);
  ELSE
    PERFORM set_config('app.current_tenant', tenant_uuid::text, true);
  END IF;
END;
$$ language plpgsql security definer;

-- Update the ensure_tenant_context function to handle platform tenant ID
CREATE OR REPLACE FUNCTION public.ensure_tenant_context()
RETURNS uuid AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  BEGIN
    current_tenant_id := current_setting('app.current_tenant', true)::uuid;
  EXCEPTION
    WHEN OTHERS THEN
      -- If app.current_tenant is not set, default to platform tenant ID
      current_tenant_id := public.get_platform_tenant_id();
      PERFORM set_config('app.current_tenant', current_tenant_id::text, true);
  END;
  RETURN current_tenant_id;
END;
$$ language plpgsql;