-- Fix the diagnostic views to use existing columns
CREATE OR REPLACE VIEW auth_diagnostics AS
SELECT 
  pal.entity_id AS match_id,
  pal.created_at,
  pal.event_type,
  pal.status,
  pal.error_details,
  pal.created_at AS error_time
FROM payout_automation_log pal
WHERE pal.event_type IN ('payout_error', 'payout_error_421', 'payout_fetch_error', 'payout_failed')
ORDER BY pal.created_at DESC;

-- Function to check environment diagnostics
CREATE OR REPLACE FUNCTION check_function_diagnostics() 
RETURNS TABLE (
  function_name text,
  recent_errors bigint,
  last_error_time timestamptz,
  error_types text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'sim_runner'::text AS function_name,
    COUNT(*) FILTER (WHERE event_type LIKE '%error%') AS recent_errors,
    MAX(created_at) FILTER (WHERE event_type LIKE '%error%') AS last_error_time,
    ARRAY_AGG(DISTINCT event_type) FILTER (WHERE event_type LIKE '%error%') AS error_types
  FROM payout_automation_log 
  WHERE created_at > now() - interval '1 hour'
    AND error_details LIKE '%sim_runner%'
    
  UNION ALL
  
  SELECT 
    'process_match_payouts'::text,
    COUNT(*) FILTER (WHERE event_type LIKE '%error%'),
    MAX(created_at) FILTER (WHERE event_type LIKE '%error%'),
    ARRAY_AGG(DISTINCT event_type) FILTER (WHERE event_type LIKE '%error%')
  FROM payout_automation_log 
  WHERE created_at > now() - interval '1 hour'
    AND entity_type = 'challenge';
END;
$$;

-- Enhanced logging function with diagnostics
CREATE OR REPLACE FUNCTION log_function_diagnostic(
  p_function_name text,
  p_event_type text,
  p_challenge_id uuid DEFAULT NULL,
  p_error_details text DEFAULT NULL,
  p_diagnostic_data text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO payout_automation_log (
    event_type,
    entity_id,
    entity_type,
    status,
    error_details
  ) VALUES (
    p_event_type,
    p_challenge_id,
    'diagnostic',
    CASE WHEN p_error_details IS NOT NULL THEN 'error' ELSE 'info' END,
    COALESCE(p_error_details, '') || ' | ' || COALESCE(p_diagnostic_data, '')
  );
END;
$$;