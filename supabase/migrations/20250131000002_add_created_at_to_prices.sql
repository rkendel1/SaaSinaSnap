ALTER TABLE prices
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create the table for AI customization sessions
CREATE TABLE public.ai_customization_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL,
    embed_type text NOT NULL,
    messages jsonb NOT NULL,
    current_options jsonb NOT NULL,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT ai_customization_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT ai_customization_sessions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.creator_profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.ai_customization_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Creators can manage their own AI sessions"
ON public.ai_customization_sessions
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Add indexes for performance
CREATE INDEX idx_ai_sessions_creator_id ON public.ai_customization_sessions(creator_id);
CREATE INDEX idx_ai_sessions_status ON public.ai_customization_sessions(status);

-- Add comments for clarity
COMMENT ON TABLE public.ai_customization_sessions IS 'Stores conversational AI sessions for customizing embeddable assets.';
COMMENT ON COLUMN public.ai_customization_sessions.creator_id IS 'The creator who owns this session.';
COMMENT ON COLUMN public.ai_customization_sessions.embed_type IS 'The type of embed being customized (e.g., product_card).';
COMMENT ON COLUMN public.ai_customization_sessions.messages IS 'The history of conversation messages between the user and AI.';
COMMENT ON COLUMN public.ai_customization_sessions.current_options IS 'The current state of the embed configuration being customized.';
COMMENT ON COLUMN public.ai_customization_sessions.status IS 'The status of the session (active, completed, paused).';