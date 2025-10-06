-- Add Stripe customer ID to creator profiles
ALTER TABLE creator_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create platform subscription checkout sessions table
CREATE TABLE IF NOT EXISTS creator_platform_checkout_sessions (
  id TEXT PRIMARY KEY,
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES platform_pricing_tiers(id) NOT NULL,
  status TEXT NOT NULL,
  url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('open', 'complete', 'expired'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_creator ON creator_platform_checkout_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON creator_platform_checkout_sessions(status);

-- Enable RLS
ALTER TABLE creator_platform_checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Creators can view own checkout sessions"
ON creator_platform_checkout_sessions
FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Platform owners can manage all checkout sessions"
ON creator_platform_checkout_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'platform_owner'
  )
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_creator_platform_checkout_sessions_updated_at
BEFORE UPDATE ON creator_platform_checkout_sessions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Add platform subscription fields to creator profiles
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS platform_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_status TEXT,
ADD COLUMN IF NOT EXISTS platform_subscription_tier UUID REFERENCES platform_pricing_tiers(id),
ADD COLUMN IF NOT EXISTS platform_subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD CONSTRAINT IF NOT EXISTS valid_subscription_status CHECK (
  platform_subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')
);

-- Add subscription indexes
CREATE INDEX IF NOT EXISTS idx_creator_subscription_status ON creator_profiles(platform_subscription_status);
CREATE INDEX IF NOT EXISTS idx_creator_subscription_tier ON creator_profiles(platform_subscription_tier);

-- Add documentation
COMMENT ON TABLE creator_platform_checkout_sessions IS 'Records of platform subscription checkout sessions';
COMMENT ON COLUMN creator_profiles.stripe_customer_id IS 'Stripe customer ID for the creator';
COMMENT ON COLUMN creator_profiles.platform_subscription_id IS 'Active platform subscription ID';
COMMENT ON COLUMN creator_profiles.platform_subscription_status IS 'Status of platform subscription';
COMMENT ON COLUMN creator_profiles.platform_subscription_tier IS 'Current platform pricing tier';
COMMENT ON COLUMN creator_profiles.platform_subscription_started_at IS 'When the current subscription period started';
COMMENT ON COLUMN creator_profiles.platform_subscription_ends_at IS 'When the current subscription period ends';