-- Create disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wager_id UUID REFERENCES public.wagers(id) ON DELETE CASCADE,
  tournament_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('wager_result', 'tournament_result', 'payment', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- Array of URLs to screenshots/videos
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  admin_response TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure at least one reference is provided
  CONSTRAINT check_reference CHECK (
    (wager_id IS NOT NULL AND tournament_match_id IS NULL) OR
    (wager_id IS NULL AND tournament_match_id IS NOT NULL) OR
    (wager_id IS NULL AND tournament_match_id IS NULL AND type IN ('payment', 'other'))
  )
);

-- Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Create policies for disputes
CREATE POLICY "Users can view their own disputes" 
ON public.disputes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create disputes" 
ON public.disputes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending disputes" 
ON public.disputes 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all disputes" 
ON public.disputes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update disputes" 
ON public.disputes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX idx_disputes_created_at ON public.disputes(created_at DESC);