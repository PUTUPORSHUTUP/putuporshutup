-- Enhanced diagnostics and permissions for auth fix
BEGIN;

-- Ensure service role can bypass RLS completely
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Add helper for auth diagnostics
CREATE OR REPLACE FUNCTION get_auth_context() 
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_name TEXT;
  claims JSON;
BEGIN
  BEGIN
    role_name := current_setting('request.jwt.claims', true)::json->>'role';
    claims := current_setting('request.jwt.claims', true)::json;
    RETURN json_build_object('role', role_name, 'claims', claims);
  EXCEPTION WHEN others THEN
    RETURN json_build_object('error', SQLERRM);
  END;
END;
$$;

-- Create error monitoring table
CREATE TABLE IF NOT EXISTS function_errors (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_code INTEGER,
  error_message TEXT,
  request_headers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow service role full access
ALTER TABLE function_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage function errors" ON function_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add automatic error logging function
CREATE OR REPLACE FUNCTION log_function_error(
  function_name TEXT,
  error_code INTEGER DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  request_headers JSONB DEFAULT NULL
) 
RETURNS VOID 
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO function_errors (function_name, error_code, error_message, request_headers)
  VALUES (function_name, error_code, error_message, request_headers);
$$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_function_errors_created_at 
ON function_errors(created_at DESC);

-- Grant permissions on new table
GRANT ALL ON function_errors TO service_role;
GRANT ALL ON function_errors_id_seq TO service_role;

COMMIT;