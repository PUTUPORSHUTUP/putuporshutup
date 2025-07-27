-- Rename tables and columns from "wager" to "challenge"

-- Rename main table
ALTER TABLE public.wagers RENAME TO challenges;

-- Rename related tables
ALTER TABLE public.wager_participants RENAME TO challenge_participants;
ALTER TABLE public.wager_teams RENAME TO challenge_teams;
ALTER TABLE public.wager_team_members RENAME TO challenge_team_members;
ALTER TABLE public.wager_stats RENAME TO challenge_stats;
ALTER TABLE public.wager_result_reports RENAME TO challenge_result_reports;

-- Update column references in renamed tables
ALTER TABLE public.challenge_participants RENAME COLUMN wager_id TO challenge_id;
ALTER TABLE public.challenge_teams RENAME COLUMN wager_id TO challenge_id;
ALTER TABLE public.challenge_stats RENAME COLUMN wager_id TO challenge_id;
ALTER TABLE public.challenge_result_reports RENAME COLUMN wager_id TO challenge_id;
ALTER TABLE public.lobby_participants RENAME COLUMN wager_id TO challenge_id;

-- Update column names in main table
ALTER TABLE public.challenges RENAME COLUMN wager_type TO challenge_type;

-- Update foreign key constraint names
ALTER TABLE public.challenge_participants DROP CONSTRAINT IF EXISTS wager_participants_wager_id_fkey;
ALTER TABLE public.challenge_participants ADD CONSTRAINT challenge_participants_challenge_id_fkey 
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_teams DROP CONSTRAINT IF EXISTS wager_teams_wager_id_fkey;
ALTER TABLE public.challenge_teams ADD CONSTRAINT challenge_teams_challenge_id_fkey 
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_stats DROP CONSTRAINT IF EXISTS wager_stats_wager_id_fkey;
ALTER TABLE public.challenge_stats ADD CONSTRAINT challenge_stats_challenge_id_fkey 
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

ALTER TABLE public.challenge_result_reports DROP CONSTRAINT IF EXISTS wager_result_reports_wager_id_fkey;
ALTER TABLE public.challenge_result_reports ADD CONSTRAINT challenge_result_reports_challenge_id_fkey 
  FOREIGN KEY (challenge_id) REFERENCES public.challenges(id) ON DELETE CASCADE;

-- Update RLS policy names and references
DROP POLICY IF EXISTS "Participants viewable by wager participants" ON public.challenge_participants;
CREATE POLICY "Participants viewable by challenge participants" 
ON public.challenge_participants 
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (EXISTS ( SELECT 1 FROM challenges w WHERE ((w.id = challenge_participants.challenge_id) AND (w.creator_id = auth.uid()))))
);

DROP POLICY IF EXISTS "Users can join wagers" ON public.challenge_participants;
CREATE POLICY "Users can join challenges" 
ON public.challenge_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their participation" ON public.challenge_participants;
CREATE POLICY "Users can update their participation" 
ON public.challenge_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update other policies referencing wagers
DROP POLICY IF EXISTS "Stats viewable by wager participants" ON public.challenge_stats;
CREATE POLICY "Stats viewable by challenge participants" 
ON public.challenge_stats 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  challenge_id IN (
    SELECT id FROM public.challenges 
    WHERE creator_id = auth.uid()
  ) OR
  challenge_id IN (
    SELECT challenge_id FROM public.challenge_participants 
    WHERE user_id = auth.uid()
  )
);

-- Update trigger names
DROP TRIGGER IF EXISTS update_wager_teams_updated_at ON public.challenge_teams;
CREATE TRIGGER update_challenge_teams_updated_at
  BEFORE UPDATE ON public.challenge_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wager_stats_updated_at ON public.challenge_stats;
CREATE TRIGGER update_challenge_stats_updated_at
  BEFORE UPDATE ON public.challenge_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();