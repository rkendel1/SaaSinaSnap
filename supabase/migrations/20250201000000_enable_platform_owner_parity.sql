-- Migration to enable platform owner parity with creators
-- This allows platform owners to:
-- 1. Create and manage embed assets
-- 2. Use AI customization sessions
-- 3. Access all features that creators have

-- For AI customization sessions:
-- Drop the foreign key constraint that requires creator_profiles
ALTER TABLE public.ai_customization_sessions
DROP CONSTRAINT IF EXISTS ai_customization_sessions_creator_id_fkey;

-- Add a foreign key to auth.users instead
-- This allows both creators (who are in auth.users) and platform owners (also in auth.users) to use AI sessions
ALTER TABLE public.ai_customization_sessions
ADD CONSTRAINT ai_customization_sessions_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the comment to reflect the change
COMMENT ON COLUMN public.ai_customization_sessions.creator_id IS 'The user (creator or platform owner) who owns this session. References auth.users for platform-wide access.';
COMMENT ON TABLE public.ai_customization_sessions IS 'Stores conversational AI sessions for customizing embeddable assets. Available to both creators and platform owners.';

-- For embed_assets:
-- Check and update embed_assets table if needed
DO $$
BEGIN
  -- Try to drop the creator_profiles FK constraint if it exists
  ALTER TABLE public.embed_assets DROP CONSTRAINT IF EXISTS embed_assets_creator_id_fkey;
  
  -- Add FK to auth.users to allow both creators and platform owners
  ALTER TABLE public.embed_assets
  ADD CONSTRAINT embed_assets_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Note: Some operations may have been skipped if columns/constraints did not exist';
END $$;

-- Update RLS policies for embed_assets to work with any authenticated user
DROP POLICY IF EXISTS "Creators can manage their own embed assets" ON public.embed_assets;
DROP POLICY IF EXISTS "Users can view public embed assets" ON public.embed_assets;

CREATE POLICY "Users can manage their own embed assets"
ON public.embed_assets
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Anyone can view public embed assets"
ON public.embed_assets
FOR SELECT
USING (is_public = true OR auth.uid() = creator_id);

-- Update comments for embed_assets
COMMENT ON COLUMN public.embed_assets.creator_id IS 'The user (creator or platform owner) who owns this embed asset. References auth.users for platform-wide access.';

