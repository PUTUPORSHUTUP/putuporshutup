-- Fix the diagnostic views to use existing columns correctly
CREATE OR REPLACE VIEW auth_diagnostics AS
SELECT 
  pal.entity_id AS match_id,
  pal.created_at,
  pal.event_type,
  pal.status,
  pal.error_message,
  pal.created_at AS error_time
FROM payout_automation_log pal
WHERE pal.event_type IN ('payout_error', 'payout_error_421', 'payout_fetch_error', 'payout_failed', 'sim_diag')
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
    AND (error_message ILIKE '%sim_runner%' OR event_type = 'sim_diag')
    
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