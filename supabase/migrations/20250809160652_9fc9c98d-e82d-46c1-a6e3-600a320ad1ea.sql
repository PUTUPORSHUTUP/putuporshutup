-- Create remaining adapter stubs
CREATE OR REPLACE FUNCTION ingest_results_apex(p_match_id uuid, p_mode_key text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- APEX adapter stub - placeholder for now
  PERFORM log_event('apex_results_stub', 
    json_build_object('match_id', p_match_id, 'mode', p_mode_key)::text);
END$$;

CREATE OR REPLACE FUNCTION ingest_results_rl(p_match_id uuid, p_mode_key text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Rocket League adapter stub - placeholder for now
  PERFORM log_event('rl_results_stub', 
    json_build_object('match_id', p_match_id, 'mode', p_mode_key)::text);
END$$;

CREATE OR REPLACE FUNCTION ingest_results_fn(p_match_id uuid, p_mode_key text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Fortnite adapter stub - placeholder for now
  PERFORM log_event('fn_results_stub', 
    json_build_object('match_id', p_match_id, 'mode', p_mode_key)::text);
END$$;