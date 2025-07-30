-- Create Xbox Live integration and leaderboard tables for PUOSU

-- Xbox leaderboard statistics table
CREATE TABLE IF NOT EXISTS public.xbox_leaderboard_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xuid TEXT NOT NULL UNIQUE,
  gamertag TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  total_kills INTEGER NOT NULL DEFAULT 0,
  total_deaths INTEGER NOT NULL DEFAULT 0,
  total_assists INTEGER NOT NULL DEFAULT 0,
  total_score BIGINT NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  challenges_won INTEGER NOT NULL DEFAULT 0,
  total_winnings NUMERIC NOT NULL DEFAULT 0,
  current_winstreak INTEGER NOT NULL DEFAULT 0,
  best_winstreak INTEGER NOT NULL DEFAULT 0,
  avg_kd_ratio NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN total_deaths > 0 THEN ROUND(total_kills::NUMERIC / total_deaths::NUMERIC, 2)
      ELSE total_kills::NUMERIC
    END
  ) STORED,
  skill_rating INTEGER NOT NULL DEFAULT 1000,
  tier TEXT NOT NULL DEFAULT 'bronze',
  last_match_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Xbox match history for verification
CREATE TABLE IF NOT EXISTS public.xbox_match_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xuid TEXT NOT NULL,
  match_id TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges(id),
  game_mode TEXT NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  placement INTEGER,
  match_duration INTEGER, -- in seconds
  match_start_time TIMESTAMP WITH TIME ZONE,
  match_end_time TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_source TEXT NOT NULL DEFAULT 'xbox_live_api',
  raw_match_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Xbox verification queue for processing
CREATE TABLE IF NOT EXISTS public.xbox_verification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  user_id UUID NOT NULL,
  xuid TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1, -- 1=normal, 2=high, 3=urgent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  submitted_stats JSONB NOT NULL,
  verification_result JSONB,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Xbox API call tracking for rate limiting
CREATE TABLE IF NOT EXISTS public.xbox_api_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  response_status INTEGER,
  response_time_ms INTEGER,
  rate_limit_remaining INTEGER,
  rate_limit_reset TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all Xbox tables
ALTER TABLE public.xbox_leaderboard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbox_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbox_verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbox_api_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Xbox Leaderboard Stats
CREATE POLICY "Xbox leaderboard stats are viewable by everyone" 
ON public.xbox_leaderboard_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own Xbox stats" 
ON public.xbox_leaderboard_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage Xbox leaderboard stats" 
ON public.xbox_leaderboard_stats 
FOR ALL 
USING (true);

-- RLS Policies for Xbox Match History
CREATE POLICY "Users can view their own Xbox match history" 
ON public.xbox_match_history 
FOR SELECT 
USING (
  xuid IN (
    SELECT xbox_xuid FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service can manage Xbox match history" 
ON public.xbox_match_history 
FOR ALL 
USING (true);

-- RLS Policies for Xbox Verification Queue
CREATE POLICY "Users can view their own verification queue" 
ON public.xbox_verification_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification requests" 
ON public.xbox_verification_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage verification queue" 
ON public.xbox_verification_queue 
FOR ALL 
USING (true);

-- RLS Policies for Xbox API Calls (admin only)
CREATE POLICY "Admins can view Xbox API calls" 
ON public.xbox_api_calls 
FOR SELECT 
USING (is_user_admin());

CREATE POLICY "Service can manage Xbox API calls" 
ON public.xbox_api_calls 
FOR ALL 
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xbox_leaderboard_stats_xuid ON xbox_leaderboard_stats(xuid);
CREATE INDEX IF NOT EXISTS idx_xbox_leaderboard_stats_skill_rating ON xbox_leaderboard_stats(skill_rating DESC);
CREATE INDEX IF NOT EXISTS idx_xbox_leaderboard_stats_winnings ON xbox_leaderboard_stats(total_winnings DESC);
CREATE INDEX IF NOT EXISTS idx_xbox_match_history_xuid ON xbox_match_history(xuid);
CREATE INDEX IF NOT EXISTS idx_xbox_match_history_challenge ON xbox_match_history(challenge_id);
CREATE INDEX IF NOT EXISTS idx_xbox_verification_queue_status ON xbox_verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_xbox_api_calls_endpoint ON xbox_api_calls(endpoint, created_at);

-- Triggers for updated_at
CREATE TRIGGER update_xbox_leaderboard_stats_updated_at
  BEFORE UPDATE ON xbox_leaderboard_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update Xbox leaderboard stats
CREATE OR REPLACE FUNCTION update_xbox_leaderboard_stats(
  p_xuid TEXT,
  p_kills INTEGER,
  p_deaths INTEGER,
  p_assists INTEGER,
  p_score INTEGER,
  p_won_challenge BOOLEAN DEFAULT false,
  p_winnings NUMERIC DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO xbox_leaderboard_stats (
    xuid, 
    gamertag,
    user_id,
    total_kills, 
    total_deaths, 
    total_assists, 
    total_score,
    matches_played,
    challenges_won,
    total_winnings,
    current_winstreak,
    best_winstreak,
    last_match_at
  )
  SELECT 
    p_xuid,
    p.xbox_gamertag,
    p.user_id,
    p_kills,
    p_deaths,
    p_assists,
    p_score,
    1,
    CASE WHEN p_won_challenge THEN 1 ELSE 0 END,
    p_winnings,
    CASE WHEN p_won_challenge THEN 1 ELSE 0 END,
    CASE WHEN p_won_challenge THEN 1 ELSE 0 END,
    NOW()
  FROM profiles p 
  WHERE p.xbox_xuid = p_xuid
  ON CONFLICT (xuid) DO UPDATE SET
    total_kills = xbox_leaderboard_stats.total_kills + p_kills,
    total_deaths = xbox_leaderboard_stats.total_deaths + p_deaths,
    total_assists = xbox_leaderboard_stats.total_assists + p_assists,
    total_score = xbox_leaderboard_stats.total_score + p_score,
    matches_played = xbox_leaderboard_stats.matches_played + 1,
    challenges_won = xbox_leaderboard_stats.challenges_won + CASE WHEN p_won_challenge THEN 1 ELSE 0 END,
    total_winnings = xbox_leaderboard_stats.total_winnings + p_winnings,
    current_winstreak = CASE 
      WHEN p_won_challenge THEN xbox_leaderboard_stats.current_winstreak + 1 
      ELSE 0 
    END,
    best_winstreak = GREATEST(
      xbox_leaderboard_stats.best_winstreak,
      CASE WHEN p_won_challenge THEN xbox_leaderboard_stats.current_winstreak + 1 ELSE 0 END
    ),
    last_match_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Add Xbox fields to existing profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xbox_linked_at') THEN
    ALTER TABLE profiles ADD COLUMN xbox_linked_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xbox_profile_picture') THEN
    ALTER TABLE profiles ADD COLUMN xbox_profile_picture TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xbox_gamer_score') THEN
    ALTER TABLE profiles ADD COLUMN xbox_gamer_score INTEGER DEFAULT 0;
  END IF;
END $$;