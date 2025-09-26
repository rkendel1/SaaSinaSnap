-- Migration: One-tenant-per-user for existing members
-- This script creates a tenant for each user in public.users without a tenant_id,
-- and assigns each user their new tenant_id.

DO $$
DECLARE
  rec RECORD;
  new_tenant_id UUID;
BEGIN
  FOR rec IN
    SELECT id, full_name FROM public.users WHERE tenant_id IS NULL
  LOOP
    -- Create a new tenant for this user
    INSERT INTO tenants (name, subdomain, active, created_at, updated_at)
    VALUES (
      COALESCE(rec.full_name, rec.id::text), -- Name the tenant after user's full_name or id
      NULL,                                  -- Set subdomain logic if needed
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_tenant_id;

    -- Assign the new tenant to the user
    UPDATE public.users
    SET tenant_id = new_tenant_id
    WHERE id = rec.id;

    RAISE NOTICE 'Assigned new tenant % to user %', new_tenant_id, rec.id;
  END LOOP;
END $$;