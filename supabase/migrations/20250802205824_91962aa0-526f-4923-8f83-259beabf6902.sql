-- Add missing columns to xbox_automation_status table
ALTER TABLE public.xbox_automation_status 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS revenue_today numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_lobbies integer DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_xbox_automation_status_is_active 
ON public.xbox_automation_status(is_active);

-- Insert default automation status if none exists
INSERT INTO public.xbox_automation_status (
  id, 
  xbox_console_id, 
  status, 
  is_active, 
  revenue_today, 
  active_lobbies,
  automation_config
)
VALUES (
  1,
  'xbox-series-x-main',
  'ready',
  false,
  0,
  0,
  '{
    "auto_lobby_creation": false,
    "revenue_optimization": false,
    "auto_match_processing": false,
    "target_revenue_per_hour": 75,
    "peak_hour_pricing": false
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;