-- Create system alerts table for monitoring (if not exists)
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  metric_value DECIMAL,
  threshold_value DECIMAL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (if not already enabled)
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Check and create policies only if they don't exist
DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_alerts' 
    AND policyname = 'Admins can view all system alerts'
  ) THEN
    CREATE POLICY "Admins can view all system alerts" ON public.system_alerts
      FOR SELECT 
      USING (is_user_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_alerts' 
    AND policyname = 'System can insert alerts'
  ) THEN
    CREATE POLICY "System can insert alerts" ON public.system_alerts
      FOR INSERT 
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_alerts' 
    AND policyname = 'Admins can update system alerts'
  ) THEN
    CREATE POLICY "Admins can update system alerts" ON public.system_alerts
      FOR UPDATE 
      USING (is_user_admin());
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON public.system_alerts(resolved, created_at DESC);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_alerts_updated_at'
  ) THEN
    CREATE TRIGGER update_system_alerts_updated_at
      BEFORE UPDATE ON public.system_alerts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert default alert configuration
INSERT INTO public.api_configurations (config_key, config_value, description) VALUES
  ('alert_error_rate_threshold', '5', 'Error rate threshold percentage for alerts'),
  ('alert_payout_deviation_threshold', '2', 'Payout deviation threshold in standard deviations'),
  ('alert_notification_email', 'admin@putuporshutup.com', 'Email address for alert notifications'),
  ('alert_notification_phone', '', 'Phone number for SMS alert notifications')
ON CONFLICT (config_key) DO NOTHING;