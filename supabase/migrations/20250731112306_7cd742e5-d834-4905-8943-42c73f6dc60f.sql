-- Create game_presence table for real-time gaming activity tracking
CREATE TABLE IF NOT EXISTS public.game_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  xbox_xuid text,
  current_game text,
  game_title_id text,
  activity_state text NOT NULL DEFAULT 'offline',
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_presence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all game presence" 
ON public.game_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage game presence" 
ON public.game_presence 
FOR ALL 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_game_presence_user_id ON public.game_presence(user_id);
CREATE INDEX idx_game_presence_is_online ON public.game_presence(is_online);
CREATE INDEX idx_game_presence_last_seen ON public.game_presence(last_seen_at);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_game_presence_updated_at
BEFORE UPDATE ON public.game_presence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the table
ALTER TABLE public.game_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_presence;