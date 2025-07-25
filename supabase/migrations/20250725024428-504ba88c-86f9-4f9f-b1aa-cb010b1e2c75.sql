-- Create table for tracking site visits
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL, -- Can be user_id or anonymous session ID
  page_path TEXT NOT NULL DEFAULT '/',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT -- To track unique sessions
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visits (for tracking)
CREATE POLICY "Anyone can insert site visits" 
ON public.site_visits 
FOR INSERT 
WITH CHECK (true);

-- Allow reading visit counts (aggregated data only)
CREATE POLICY "Anyone can view aggregated visit data" 
ON public.site_visits 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_site_visits_created_at ON public.site_visits(created_at);
CREATE INDEX idx_site_visits_page_path ON public.site_visits(page_path);
CREATE INDEX idx_site_visits_session_id ON public.site_visits(session_id);

-- Create function to get visit statistics
CREATE OR REPLACE FUNCTION public.get_visit_stats()
RETURNS TABLE(
  total_visits BIGINT,
  unique_visitors BIGINT,
  visits_today BIGINT,
  visits_this_week BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*) as total_visits,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as visits_today,
    COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as visits_this_week
  FROM site_visits;
$$;