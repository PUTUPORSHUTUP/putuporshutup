-- Create sponsor_performance table for tracking sponsorship metrics
CREATE TABLE public.sponsor_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  logo_impressions INTEGER NOT NULL DEFAULT 0,
  clicks_to_site INTEGER NOT NULL DEFAULT 0,
  report_link TEXT NOT NULL,
  sponsor_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sponsor_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for sponsor performance data
CREATE POLICY "Admins can manage all sponsor performance data" 
ON public.sponsor_performance 
FOR ALL 
USING (is_user_admin());

CREATE POLICY "Sponsors can view their own performance data" 
ON public.sponsor_performance 
FOR SELECT 
USING (auth.uid() = sponsor_user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sponsor_performance_updated_at
BEFORE UPDATE ON public.sponsor_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();