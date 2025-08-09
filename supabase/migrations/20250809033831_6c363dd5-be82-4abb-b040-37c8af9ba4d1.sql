-- Create only user-facing RLS policies that don't exist

-- Create policies for users to view their own data
CREATE POLICY IF NOT EXISTS "Users can view their own wallet" 
  ON public.wallets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view their queue entries" 
  ON public.match_queue FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view matches they participate in" 
  ON public.matches FOR SELECT USING (player_a = auth.uid() OR player_b = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view results for their matches" 
  ON public.match_results FOR SELECT USING (EXISTS (
    SELECT 1 FROM matches m 
    WHERE m.id = match_results.match_id 
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  ));