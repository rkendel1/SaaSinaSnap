-- Create custom domains table
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'verified', 'failed')),
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_custom_domains_creator_id ON public.custom_domains(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON public.custom_domains(status);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for custom domains
CREATE POLICY "Creators can view their own domains"
  ON public.custom_domains
  FOR SELECT
  USING (creator_id IN (
    SELECT id FROM public.creator_profiles WHERE id = creator_id
  ));

CREATE POLICY "Creators can manage their own domains"
  ON public.custom_domains
  FOR ALL
  USING (creator_id IN (
    SELECT id FROM public.creator_profiles WHERE id = creator_id
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
