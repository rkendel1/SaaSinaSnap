/**
 * COMPREHENSIVE SITE ANALYSIS & CREATOR SUBSCRIPTION SUPPORT
 * 
 * This migration adds:
 * 1. Comprehensive site data extraction storage
 * 2. Creator subscription/payment tracking
 * 3. Enhanced white-label page generation support
 */

-- Add comprehensive site analysis data to creator_profiles
ALTER TABLE creator_profiles 
  ADD COLUMN IF NOT EXISTS extracted_site_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_analysis_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_analysis_last_run TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS site_content_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_voice_tone JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_company_info JSONB DEFAULT '{}'::jsonb;

-- Add creator subscription tracking
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS platform_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_subscription_status TEXT CHECK (platform_subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  ADD COLUMN IF NOT EXISTS platform_subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS platform_subscription_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS platform_subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Add white-label generation tracking
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS white_label_pages_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS white_label_generation_status TEXT CHECK (white_label_generation_status IN ('pending', 'in_progress', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS white_label_generated_at TIMESTAMP WITH TIME ZONE;

-- Create platform pricing tiers table
CREATE TABLE IF NOT EXISTS platform_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT CHECK (char_length(currency) = 3) DEFAULT 'usd',
  billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly', 'one_time')) DEFAULT 'monthly',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create creator subscriptions table (for platform subscriptions)
CREATE TABLE IF NOT EXISTS creator_platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES platform_pricing_tiers(id) NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'trialing',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creator_profiles_site_analysis ON creator_profiles(site_analysis_completed);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_subscription_status ON creator_profiles(platform_subscription_status);
CREATE INDEX IF NOT EXISTS idx_creator_platform_subscriptions_creator ON creator_platform_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_platform_subscriptions_status ON creator_platform_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_platform_pricing_tiers_active ON platform_pricing_tiers(active, sort_order);

-- Add RLS policies
ALTER TABLE platform_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Platform pricing tiers are publicly viewable
CREATE POLICY "Anyone can view active platform pricing tiers" 
  ON platform_pricing_tiers FOR SELECT 
  USING (active = true);

-- Platform owners can manage pricing tiers
CREATE POLICY "Platform owners can manage pricing tiers" 
  ON platform_pricing_tiers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'platform_owner'
    )
  );

-- Creators can view their own subscriptions
CREATE POLICY "Creators can view own platform subscriptions" 
  ON creator_platform_subscriptions FOR SELECT 
  USING (auth.uid() = creator_id);

-- Creators can insert their own subscriptions
CREATE POLICY "Creators can create own platform subscriptions" 
  ON creator_platform_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

-- Platform owners can view all subscriptions
CREATE POLICY "Platform owners can view all subscriptions" 
  ON creator_platform_subscriptions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'platform_owner'
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_platform_pricing_tiers_updated_at 
  BEFORE UPDATE ON platform_pricing_tiers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_creator_platform_subscriptions_updated_at 
  BEFORE UPDATE ON creator_platform_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN creator_profiles.extracted_site_data IS 'Comprehensive extracted data from creator website including design tokens, content, voice, and company info';
COMMENT ON COLUMN creator_profiles.site_content_data IS 'Extracted content: headlines, taglines, value propositions, features';
COMMENT ON COLUMN creator_profiles.site_voice_tone IS 'Analyzed voice and tone from website content';
COMMENT ON COLUMN creator_profiles.site_company_info IS 'Extracted company information: name, description, services, contact';
COMMENT ON COLUMN creator_profiles.platform_subscription_status IS 'Status of creator subscription to the platform';
COMMENT ON COLUMN creator_profiles.white_label_pages_generated IS 'Whether white-label pages have been auto-generated for this creator';

COMMENT ON TABLE platform_pricing_tiers IS 'Pricing tiers for creators to subscribe to the platform';
COMMENT ON TABLE creator_platform_subscriptions IS 'Creator subscriptions to platform pricing tiers';

-- Insert default platform pricing tiers
INSERT INTO platform_pricing_tiers (name, description, price, billing_period, features, limits, sort_order, active) VALUES
  (
    'Starter',
    'Perfect for getting started with your SaaS',
    29.00,
    'monthly',
    '["White-label pages", "Stripe integration", "Up to 100 customers", "Email support", "Basic analytics"]'::jsonb,
    '{"max_customers": 100, "max_products": 5, "max_pages": 10}'::jsonb,
    1,
    true
  ),
  (
    'Professional',
    'For growing SaaS businesses',
    99.00,
    'monthly',
    '["Everything in Starter", "Up to 1,000 customers", "Custom domain", "Priority support", "Advanced analytics", "API access"]'::jsonb,
    '{"max_customers": 1000, "max_products": 20, "max_pages": 50}'::jsonb,
    2,
    true
  ),
  (
    'Enterprise',
    'For established SaaS companies',
    299.00,
    'monthly',
    '["Everything in Professional", "Unlimited customers", "Unlimited products", "Dedicated support", "Custom integrations", "White-glove onboarding"]'::jsonb,
    '{"max_customers": -1, "max_products": -1, "max_pages": -1}'::jsonb,
    3,
    true
  )
ON CONFLICT DO NOTHING;