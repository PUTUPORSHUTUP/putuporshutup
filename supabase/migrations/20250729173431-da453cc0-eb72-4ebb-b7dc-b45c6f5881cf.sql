-- Remove the overly broad service policy
DROP POLICY IF EXISTS "Service can manage all stats" ON public.player_stats;

-- Add more specific policies
CREATE POLICY "Moderators can view all stats"
  ON public.player_stats
  FOR SELECT
  USING (is_user_moderator());

CREATE POLICY "Admins can manage all stats"
  ON public.player_stats
  FOR ALL
  USING (is_user_admin());