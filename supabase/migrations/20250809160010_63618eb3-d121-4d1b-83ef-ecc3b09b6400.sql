-- Create the adapter pattern dispatcher function
CREATE OR REPLACE FUNCTION ingest_results(p_match_id uuid, p_mode_key text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  CASE
    WHEN p_mode_key LIKE 'COD6:%' THEN PERFORM ingest_results_cod6(p_match_id, p_mode_key);
    WHEN p_mode_key LIKE 'APEX:%' THEN PERFORM ingest_results_apex(p_match_id, p_mode_key);
    WHEN p_mode_key LIKE 'RL:%'   THEN PERFORM ingest_results_rl(p_match_id, p_mode_key);
    WHEN p_mode_key LIKE 'FN:%'   THEN PERFORM ingest_results_fn(p_match_id, p_mode_key);
    ELSE RAISE EXCEPTION 'unsupported_mode %', p_mode_key;
  END CASE;
END$$;

-- Create stub adapter functions for each game (start with placeholders)
CREATE OR REPLACE FUNCTION ingest_results_cod6(p_match_id uuid, p_mode_key text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- COD6 adapter stub - just set random placements for now
  INSERT INTO market_match_results (match_id, user_id, placement)
  SELECT 
    p_match_id,
    mm.player_a,
    1  -- Winner
  FROM market_matches mm
  WHERE mm.id = p_match_id;
  
  INSERT INTO market_match_results (match_id, user_id, placement)
  SELECT 
    p_match_id,
    mm.player_b,
    2  -- Second place
  FROM market_matches mm
  WHERE mm.id = p_match_id;
  
  -- Log the result ingestion
  PERFORM log_event('cod6_results_ingested', 
    json_build_object('match_id', p_match_id, 'mode', p_mode_key)::text);
END$$;