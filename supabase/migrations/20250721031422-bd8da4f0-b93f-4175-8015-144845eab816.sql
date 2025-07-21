-- Expand games table with more comprehensive game data
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

-- Insert game modes for popular games
INSERT INTO public.game_modes (game_id, mode_name, mode_description, max_players) 
SELECT g.id, mode.name, mode.description, mode.max_players
FROM public.games g,
(VALUES 
  ('call-of-duty-warzone', '1v1 Gulag', 'Intense 1v1 combat in the gulag', 2),
  ('call-of-duty-warzone', 'Squad vs Squad', 'Team-based combat', 8),
  ('fortnite', '1v1 Build Battle', 'Classic build and fight', 2),
  ('fortnite', 'Zone Wars', 'Late-game simulation', 16),
  ('rocket-league', '1v1 Duel', 'One-on-one soccer car combat', 2),
  ('rocket-league', '2v2 Doubles', 'Team-based rocket car soccer', 4),
  ('rocket-league', '3v3 Standard', 'Classic rocket league match', 6),
  ('valorant', '1v1 Aim Duel', 'Pure aim competition', 2),
  ('valorant', '5v5 Competitive', 'Full team competitive match', 10),
  ('cs2', '1v1 Aim Map', 'Aim training and dueling', 2),
  ('cs2', '5v5 Competitive', 'Classic Counter-Strike match', 10),
  ('fifa-24', '1v1 Ultimate', 'Head-to-head football', 2),
  ('fifa-24', 'Pro Clubs 11v11', 'Full team football match', 22),
  ('apex-legends', '1v1 Arena', 'Legends combat arena', 2),
  ('apex-legends', '3v3 Ranked', 'Squad-based ranked match', 6),
  ('league-of-legends', '1v1 Mid Lane', 'Solo lane showdown', 2),
  ('league-of-legends', '5v5 Ranked', 'Full team ranked match', 10),
  ('overwatch-2', '1v1 Mystery Heroes', 'Random hero duels', 2),
  ('overwatch-2', '6v6 Competitive', 'Team-based objective game', 12),
  ('minecraft', '1v1 PvP', 'Player vs player combat', 2),
  ('minecraft', 'Build Battle', 'Creative building competition', 8)
) AS mode(game_name, name, description, max_players)
WHERE g.name = mode.game_name
ON CONFLICT (game_id, mode_name) DO NOTHING;

-- Create notifications table for real-time features
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service can create notifications for users
CREATE POLICY "Service can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Add real-time capabilities to critical tables
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.match_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.wagers REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wagers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;