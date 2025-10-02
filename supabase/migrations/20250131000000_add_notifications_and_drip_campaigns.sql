-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_creator_id ON public.notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create drip campaigns table
CREATE TABLE IF NOT EXISTS public.drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  email_sequence JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drip campaign subscribers table
CREATE TABLE IF NOT EXISTS public.drip_campaign_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.drip_campaigns(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  current_step INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMPTZ,
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for drip campaigns
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_creator_id ON public.drip_campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaign_subscribers_campaign_id ON public.drip_campaign_subscribers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaign_subscribers_email ON public.drip_campaign_subscribers(customer_email);

-- Enable RLS for drip campaigns
ALTER TABLE public.drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_campaign_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for drip campaigns
CREATE POLICY "Creators can view their own campaigns"
  ON public.drip_campaigns
  FOR SELECT
  USING (creator_id IN (
    SELECT id FROM public.creator_profiles WHERE id = creator_id
  ));

CREATE POLICY "Creators can manage their own campaigns"
  ON public.drip_campaigns
  FOR ALL
  USING (creator_id IN (
    SELECT id FROM public.creator_profiles WHERE id = creator_id
  ));

CREATE POLICY "System can manage drip campaign subscribers"
  ON public.drip_campaign_subscribers
  FOR ALL
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drip_campaigns_updated_at
  BEFORE UPDATE ON public.drip_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drip_campaign_subscribers_updated_at
  BEFORE UPDATE ON public.drip_campaign_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
