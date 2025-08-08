-- Fix security issues for newly created tables and functions

-- Enable RLS on new tables that might be missing it
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY; 
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_events
CREATE POLICY "Admins can view market events" 
ON market_events FOR SELECT 
USING (is_user_admin());

CREATE POLICY "Service can insert market events" 
ON market_events FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for match_results  
CREATE POLICY "Players can view their match results" 
ON match_results FOR SELECT 
USING (player_id = auth.uid() OR is_user_admin());

CREATE POLICY "Service can insert match results" 
ON match_results FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view their wallet transactions" 
ON wallet_transactions FOR SELECT 
USING (profile_id = auth.uid() OR is_user_admin());

CREATE POLICY "Service can insert wallet transactions" 
ON wallet_transactions FOR INSERT 
WITH CHECK (true);

-- Fix function search path for log_event function
CREATE OR REPLACE FUNCTION log_event(event_type TEXT, details TEXT) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO market_events (event_type, details)
  VALUES (event_type, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;