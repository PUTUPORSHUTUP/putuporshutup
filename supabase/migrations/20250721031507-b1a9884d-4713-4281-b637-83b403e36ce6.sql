-- Fix the games table with proper unique constraint
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_name_key;
ALTER TABLE public.games ADD CONSTRAINT games_name_unique UNIQUE (name);

-- Now safely insert/update games data
INSERT INTO public.games (name, display_name, description, platform, image_url, is_active) VALUES
  ('call-of-duty-warzone', 'Call of Duty: Warzone', 'Battle royale and multiplayer combat', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('fortnite', 'Fortnite', 'Battle royale with building mechanics', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('rocket-league', 'Rocket League', 'Soccer meets driving in this physics-based game', ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('valorant', 'VALORANT', 'Tactical 5v5 character-based shooter', ARRAY['PC'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('cs2', 'Counter-Strike 2', 'Competitive tactical FPS', ARRAY['PC'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('fifa-24', 'EA FC 24', 'Football simulation game', ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('apex-legends', 'Apex Legends', 'Squad-based battle royale', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('league-of-legends', 'League of Legends', 'Multiplayer online battle arena', ARRAY['PC'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('overwatch-2', 'Overwatch 2', 'Team-based multiplayer FPS', ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('pubg', 'PUBG: BATTLEGROUNDS', 'Realistic battle royale experience', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('minecraft', 'Minecraft', 'Sandbox building and survival game', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true),
  ('fall-guys', 'Fall Guys', 'Multiplayer party battle royale', ARRAY['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  platform = EXCLUDED.platform,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- Create game_modes table for different game modes
CREATE TABLE IF NOT EXISTS public.game_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  mode_name TEXT NOT NULL,
  mode_description TEXT,
  max_players INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, mode_name)
);

-- Enable RLS for game_modes
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing game modes
CREATE POLICY "Game modes are viewable by everyone" 
ON public.game_modes 
FOR SELECT 
USING (true);