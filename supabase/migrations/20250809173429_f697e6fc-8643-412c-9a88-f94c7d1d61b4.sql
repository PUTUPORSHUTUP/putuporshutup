-- Update market engine cycle from 8 minutes to 4 minutes
-- First, remove any existing market automation cron jobs
SELECT cron.unschedule('database-market-engine') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'database-market-engine'
);

-- Create new 4-minute cycle for database market engine
SELECT cron.schedule(
  'database-market-engine',
  '*/4 * * * *', -- Every 4 minutes instead of 8
  $$
  SELECT net.http_post(
    url := 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/database-market-engine',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
    body := '{"auto_seed": true, "mode_key": "COD6:KILL_RACE"}'::jsonb
  ) as request_id;
  $$
);