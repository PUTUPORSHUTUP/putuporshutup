-- Set up cron jobs for the cycling match system
SELECT cron.schedule(
  'auto-cycle-matches',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/auto-cycle-matches',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'close-old-opens',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/close-old-opens',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);