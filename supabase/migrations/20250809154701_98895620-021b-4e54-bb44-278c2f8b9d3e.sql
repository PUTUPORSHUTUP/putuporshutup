-- Add RLS policies for game_registry table
CREATE POLICY "Game registry is viewable by everyone"
  ON public.game_registry FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage game registry"
  ON public.game_registry FOR ALL
  USING (is_user_admin());