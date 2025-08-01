-- Create a secure configuration table for API keys and settings
CREATE TABLE IF NOT EXISTS public.api_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write API configurations
CREATE POLICY "Admins can manage API configurations" 
ON public.api_configurations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_api_configurations_updated_at
BEFORE UPDATE ON public.api_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the current Xbox API key placeholder
INSERT INTO public.api_configurations (config_key, config_value, description)
VALUES ('XBOX_API_KEY', '', 'Xbox Live API key for gamertag verification and stat retrieval')
ON CONFLICT (config_key) DO NOTHING;