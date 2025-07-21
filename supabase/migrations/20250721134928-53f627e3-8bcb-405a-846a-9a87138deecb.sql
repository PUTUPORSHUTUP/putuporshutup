-- Create responsible gambling features tables
CREATE TABLE public.user_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('daily_deposit', 'weekly_deposit', 'monthly_deposit', 'daily_wager', 'weekly_wager', 'monthly_wager')),
  limit_amount NUMERIC NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, limit_type)
);

-- Create self-exclusion table
CREATE TABLE public.self_exclusions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exclusion_type TEXT NOT NULL CHECK (exclusion_type IN ('temporary', 'permanent')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create addiction resources table
CREATE TABLE public.addiction_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  phone_number TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('hotline', 'website', 'support_group', 'counseling')),
  country_code TEXT DEFAULT 'US',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addiction_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_limits
CREATE POLICY "Users can view their own limits" 
ON public.user_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own limits" 
ON public.user_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own limits" 
ON public.user_limits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for self_exclusions
CREATE POLICY "Users can view their own exclusions" 
ON public.self_exclusions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exclusions" 
ON public.self_exclusions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for addiction_resources
CREATE POLICY "Resources are viewable by everyone" 
ON public.addiction_resources 
FOR SELECT 
USING (is_active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_user_limits_updated_at
BEFORE UPDATE ON public.user_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default addiction resources
INSERT INTO public.addiction_resources (title, description, url, phone_number, resource_type, country_code) VALUES
('National Problem Gambling Helpline', '24/7 confidential helpline for problem gambling', 'https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/', '1-800-522-4700', 'hotline', 'US'),
('Gamblers Anonymous', 'Fellowship of men and women who share their experience, strength and hope', 'https://www.gamblersanonymous.org/', NULL, 'support_group', 'US'),
('GamCare', 'UK support for gambling problems', 'https://www.gamcare.org.uk/', '0808 8020 133', 'website', 'UK'),
('Gambling Therapy', 'Global online support for gambling addiction', 'https://www.gamblingtherapy.org/', NULL, 'website', 'GLOBAL');

-- Create function to check if user is excluded
CREATE OR REPLACE FUNCTION public.is_user_excluded(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.self_exclusions 
    WHERE user_id = user_uuid 
    AND is_active = true 
    AND (exclusion_type = 'permanent' OR (exclusion_type = 'temporary' AND end_date > now()))
  );
END;
$$;