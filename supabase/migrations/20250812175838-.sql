-- Enable RLS on match_cycle_state table
ALTER TABLE public.match_cycle_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for match_cycle_state (admin/service only)
CREATE POLICY "Service role can manage match cycle state" ON public.match_cycle_state
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.close_stale_matches() 
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.match_queue
  SET status = 'closed'
  WHERE automated IS true
    AND status = 'open'
    AND now() > COALESCE(expires_at, now());
END $$;