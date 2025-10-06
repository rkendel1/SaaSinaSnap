-- Fix platform_settings RLS policy to restrict access to platform owners only
-- This addresses a critical security vulnerability where any authenticated user could read platform settings

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to read platform settings" ON platform_settings;

-- Create a new policy that only allows platform owners to read their own settings
CREATE POLICY "Platform owners can read own settings" ON platform_settings
  FOR SELECT
  USING (
    auth.uid() = owner_id
  );

-- Ensure platform owners can insert their own settings
CREATE POLICY "Platform owners can insert own settings" ON platform_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
  );

-- The update policy already exists and is correct, but let's recreate it for consistency
DROP POLICY IF EXISTS "Allow platform owner to update platform settings" ON platform_settings;

CREATE POLICY "Platform owners can update own settings" ON platform_settings
  FOR UPDATE
  USING (
    auth.uid() = owner_id
  );

-- Add delete policy for completeness
CREATE POLICY "Platform owners can delete own settings" ON platform_settings
  FOR DELETE
  USING (
    auth.uid() = owner_id
  );