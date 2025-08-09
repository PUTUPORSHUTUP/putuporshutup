-- Create health log table for monitoring system uptime and issues
CREATE TABLE IF NOT EXISTS public.health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,                -- "ok" | "error"
  rotation_fresh BOOLEAN,
  queue_fresh BOOLEAN,
  db_ok BOOLEAN,
  details JSONB,                       -- extra context (counts, messages)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read health logs for uptime monitoring
CREATE POLICY "read health logs (auth)"
ON public.health_log FOR SELECT
TO authenticated
USING (true);