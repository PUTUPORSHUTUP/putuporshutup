-- Fix function search path for log_event function only
CREATE OR REPLACE FUNCTION log_event(event_type TEXT, details TEXT) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO market_events (event_type, details)
  VALUES (event_type, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;