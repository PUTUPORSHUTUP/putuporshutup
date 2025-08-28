-- Set up cron job for tournament automation (runs every 5 minutes)
SELECT cron.schedule(
  'tournament-automation',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/tournament-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:='{"automation": "tournament-cycle", "timestamp": "'|| now() ||'"}'::jsonb
    ) as request_id;
  $$
);