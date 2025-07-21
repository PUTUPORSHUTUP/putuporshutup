-- Insert game modes for the new games
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