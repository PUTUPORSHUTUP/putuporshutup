-- Create missing Xbox tables with correct structure
CREATE TABLE IF NOT EXISTS public.xbox_leaderboard_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xuid text NOT NULL UNIQUE,
  gamertag text NOT NULL,
  total_kills integer DEFAULT 0,
  total_deaths integer DEFAULT 0,
  total_assists integer DEFAULT 0,
  total_score integer DEFAULT 0,
  matches_played integer DEFAULT 0,
  challenges_won integer DEFAULT 0,
  total_winnings numeric DEFAULT 0,
  current_winstreak integer DEFAULT 0,
  best_winstreak integer DEFAULT 0,
  last_match_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.xbox_match_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xuid text NOT NULL,
  match_id text NOT NULL,
  game_title text NOT NULL,
  kills integer DEFAULT 0,
  deaths integer DEFAULT 0,
  assists integer DEFAULT 0,
  score integer DEFAULT 0,
  match_duration integer,
  match_result text,
  challenge_id uuid,
  verified boolean DEFAULT false,
  match_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.xbox_verification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL,
  xuid text NOT NULL,
  status text DEFAULT 'pending',
  verification_data jsonb,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xbox_leaderboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbox_match_history ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.xbox_verification_queue ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Xbox stats public" ON public.xbox_leaderboard_stats FOR SELECT USING (true);
CREATE POLICY "Xbox history public" ON public.xbox_match_history FOR SELECT USING (true);
CREATE POLICY "Xbox queue service access" ON public.xbox_verification_queue FOR ALL USING (true);