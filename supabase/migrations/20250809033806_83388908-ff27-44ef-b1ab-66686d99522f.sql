-- Create only missing RLS policies

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service can manage wallets" ON public.wallets;
DROP POLICY IF EXISTS "Service can manage match queue" ON public.match_queue;  
DROP POLICY IF EXISTS "Service can manage matches" ON public.matches;
DROP POLICY IF EXISTS "Service can manage match results" ON public.match_results;

-- Create user-facing policies (these shouldn't exist yet)
CREATE POLICY "Users can view their own wallet" ON public.wallets 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their queue entries" ON public.match_queue 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view matches they participate in" ON public.matches 
  FOR SELECT USING (player_a = auth.uid() OR player_b = auth.uid());

CREATE POLICY "Users can view results for their matches" ON public.match_results 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM matches m 
    WHERE m.id = match_results.match_id 
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  ));

-- Recreate service policies
CREATE POLICY "Service can manage all wallets" ON public.wallets 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all queue entries" ON public.match_queue 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all matches" ON public.matches 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all match results" ON public.match_results 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');