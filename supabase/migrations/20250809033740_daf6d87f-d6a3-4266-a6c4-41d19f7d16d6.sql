-- Fix security warnings by enabling RLS and adding proper policies

-- Enable RLS on the new tables (if not already enabled)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies for the new tables
CREATE POLICY "Users can view their own wallet" ON public.wallets 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can manage all wallets" ON public.wallets 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their queue entries" ON public.match_queue 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can manage all queue entries" ON public.match_queue 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view matches they participate in" ON public.matches 
  FOR SELECT USING (player_a = auth.uid() OR player_b = auth.uid());

CREATE POLICY "Service can manage all matches" ON public.matches 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view results for their matches" ON public.match_results 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM matches m 
    WHERE m.id = match_results.match_id 
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  ));

CREATE POLICY "Service can manage all match results" ON public.match_results 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions to service role
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.match_queue TO service_role;  
GRANT ALL ON public.matches TO service_role;
GRANT ALL ON public.match_results TO service_role;
GRANT EXECUTE ON FUNCTION public.db_market_payout_safe(UUID, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.db_market_run(BOOLEAN) TO anon, authenticated, service_role;