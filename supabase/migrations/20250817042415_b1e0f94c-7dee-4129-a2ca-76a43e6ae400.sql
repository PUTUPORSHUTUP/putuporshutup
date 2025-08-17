-- Set up cron job for auto-cycle-matches to run every 30 minutes
-- First, ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-cycle-matches function to run every 30 minutes
SELECT cron.schedule(
  'auto-cycle-matches',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/auto-cycle-matches',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzNzUyMywiZXhwIjoyMDY4NjEzNTIzfQ.1pj0VQsGcO7ZrdKBb_6OWKH6Zzxre1KKTr4sKgjdFjU"}'::jsonb,
    body := '{"cron": true}'::jsonb
  );
  $$
);

-- List all cron jobs to verify
SELECT * FROM cron.job;