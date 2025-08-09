-- Fix log_event function to handle JSONB properly
CREATE OR REPLACE FUNCTION log_event(event_type TEXT, details TEXT) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO market_events (event_type, details)
  VALUES (event_type, details::jsonb);
EXCEPTION 
  WHEN OTHERS THEN
    -- If JSON conversion fails, wrap in a simple JSON object
    INSERT INTO market_events (event_type, details)
    VALUES (event_type, json_build_object('message', details)::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;