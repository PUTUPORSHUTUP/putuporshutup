-- Fix RLS policies for tournament_posters table
DROP POLICY IF EXISTS "Service can manage tournament posters" ON public.tournament_posters;
DROP POLICY IF EXISTS "Tournament posters are viewable by everyone" ON public.tournament_posters;

-- Create proper RLS policies for tournament_posters
CREATE POLICY "Tournament posters are viewable by everyone" 
ON public.tournament_posters 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert tournament posters" 
ON public.tournament_posters 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tournament posters" 
ON public.tournament_posters 
FOR ALL 
USING (is_user_admin());