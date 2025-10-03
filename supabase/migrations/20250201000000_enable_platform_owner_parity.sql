/**
 * PLATFORM OWNER FEATURE PARITY
 * This migration enables platform owners to have the same capabilities as creators
 * by updating FK constraints and RLS policies to reference auth.users instead of creator_profiles
 */

-- =====================================================
-- 1. AI CUSTOMIZATION SESSIONS - Enable Platform Owner Access
-- =====================================================

-- Disable RLS temporarily for schema modifications
ALTER TABLE ai_customization_sessions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Creators can manage their own AI sessions" ON ai_customization_sessions;

-- Drop the FK constraint to creator_profiles
ALTER TABLE ai_customization_sessions 
  DROP CONSTRAINT IF EXISTS ai_customization_sessions_creator_id_fkey;

-- Add FK constraint to auth.users instead
ALTER TABLE ai_customization_sessions 
  ADD CONSTRAINT ai_customization_sessions_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE ai_customization_sessions ENABLE ROW LEVEL SECURITY;

-- Create new policy allowing any authenticated user to manage their own sessions
CREATE POLICY "Authenticated users can manage their own AI sessions"
ON ai_customization_sessions
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Add comment to clarify the change
COMMENT ON COLUMN ai_customization_sessions.creator_id IS 
'References auth.users.id - can be either a creator or platform owner. Kept as creator_id for backward compatibility.';


-- =====================================================
-- 2. EMBED ASSETS - Enable Platform Owner Access
-- =====================================================

-- Disable RLS temporarily for schema modifications
ALTER TABLE embed_assets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Creators can manage their own assets." ON embed_assets;
DROP POLICY IF EXISTS "Public can view shared assets." ON embed_assets;

-- Drop the FK constraint to creator_profiles
ALTER TABLE embed_assets 
  DROP CONSTRAINT IF EXISTS embed_assets_creator_id_fkey;

-- Add FK constraint to auth.users instead
ALTER TABLE embed_assets 
  ADD CONSTRAINT embed_assets_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE embed_assets ENABLE ROW LEVEL SECURITY;

-- Create new policies allowing any authenticated user to manage their own assets
CREATE POLICY "Authenticated users can manage their own assets"
ON embed_assets
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Public can view shared assets"
ON embed_assets
FOR SELECT
USING (is_public = true OR share_enabled = true);

-- Add comment to clarify the change
COMMENT ON COLUMN embed_assets.creator_id IS 
'References auth.users.id - can be either a creator or platform owner. Kept as creator_id for backward compatibility.';


-- =====================================================
-- 3. Update Indexes (if needed)
-- =====================================================

-- Indexes should still work fine with the new FK constraint
-- No changes needed as the column name and type remain the same


-- =====================================================
-- 4. Verification Comments
-- =====================================================

-- This migration enables platform owners to:
-- 1. Create and manage AI customization sessions
-- 2. Create and manage embed assets
-- Both features were previously restricted to users with creator_profiles
-- Now any authenticated user (including platform owners) can use these features
