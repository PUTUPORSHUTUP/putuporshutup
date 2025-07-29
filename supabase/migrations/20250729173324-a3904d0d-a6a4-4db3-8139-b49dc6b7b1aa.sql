-- Create player_stats table for silent stat logging
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  challenge_id UUID,
  stats_data JSONB NOT NULL DEFAULT '{}',
  match_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for player stats
CREATE POLICY "Users can view their own stats"
  ON public.player_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.player_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage all stats"
  ON public.player_stats
  FOR ALL
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_player_stats_user_game ON public.player_stats(user_id, game_name);
CREATE INDEX idx_player_stats_challenge ON public.player_stats(challenge_id);
CREATE INDEX idx_player_stats_date ON public.player_stats(match_date);