-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule trending games orchestrator to run daily at 8 AM
SELECT cron.schedule(
  'daily-trending-games-update',
  '0 8 * * *', -- 8 AM daily
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/trending-games-orchestrator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:='{"scheduled_run": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule game automation orchestrator to run every 30 minutes
SELECT cron.schedule(
  'game-automation-check',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/game-automation-orchestrator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:='{"automation_check": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule automation orchestrator to run every hour for general automation tasks
SELECT cron.schedule(
  'automation-orchestrator-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/automation-orchestrator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:='{"scheduled_maintenance": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a soft launch announcement table for tracking launch metrics
CREATE TABLE IF NOT EXISTS public.soft_launch_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soft_launch_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage launch metrics
CREATE POLICY "Admins can manage launch metrics" 
ON public.soft_launch_metrics 
FOR ALL 
USING (is_user_admin());

-- Create policy for public to view basic metrics
CREATE POLICY "Public can view basic launch metrics" 
ON public.soft_launch_metrics 
FOR SELECT 
USING (metric_type IN ('total_users', 'active_challenges', 'completed_matches'));

-- Insert initial launch tracking
INSERT INTO public.soft_launch_metrics (metric_type, metric_value, metadata) VALUES
('soft_launch_started', 1, '{"launch_date": "2025-01-31", "launch_time": "12:00 PM"}'),
('automation_games_count', 7, '{"games": ["Apex Legends", "Rocket League", "Fortnite", "Valorant", "Call of Duty", "Xbox Integration"]}'),
('platform_readiness', 95, '{"core_features": "complete", "automation": "ready", "payments": "active"}')