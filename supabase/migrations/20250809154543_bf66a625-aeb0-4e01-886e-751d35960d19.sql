-- Enable RLS on the new tables
ALTER TABLE public.game_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for game_registry table
CREATE POLICY "Game registry is viewable by everyone"
  ON public.game_registry FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage game registry"
  ON public.game_registry FOR ALL
  USING (is_user_admin());

-- Add RLS policies for game_modes table  
CREATE POLICY "Game modes are viewable by everyone"
  ON public.game_modes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage game modes"
  ON public.game_modes FOR ALL
  USING (is_user_admin());