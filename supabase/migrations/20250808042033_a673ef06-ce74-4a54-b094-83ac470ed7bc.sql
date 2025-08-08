-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule sim runner to run every 8 minutes
SELECT cron.schedule(
  'puosu-sim-runner-every-8',
  '*/8 * * * *',
  $$
  SELECT
    http_post(
      'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/sim_runner',
      '{"auto": true}'::json,
      'application/json',
      'Authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzNzUyMywiZXhwIjoyMDY4NjEzNTIzfQ.cMnLRJjJOGBCFKBfPuRRG83cGOctWI3xFhb3LcfwNEA'
    )
  $$
);