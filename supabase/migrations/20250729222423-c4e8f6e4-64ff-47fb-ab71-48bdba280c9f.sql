-- Create skill rating and tier system for fair matchmaking
CREATE TYPE skill_tier AS ENUM ('novice', 'amateur', 'intermediate', 'advanced', 'expert', 'pro');

-- Create player skill ratings table
CREATE TABLE public.player_skill_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  skill_tier skill_tier NOT NULL DEFAULT 'novice',
  skill_rating integer NOT NULL DEFAULT 1000, -- ELO-style rating
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  win_rate numeric(4,2) DEFAULT 0.00,
  average_kd numeric(4,2) DEFAULT 0.00,
  last_match_at timestamp with time zone,
  tier_locked_until timestamp with time zone, -- Prevents sandbagging
  verified_stats boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Create tier protection rules
CREATE TABLE public.tier_protection_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  tier skill_tier NOT NULL,
  max_entry_fee numeric(10,2) NOT NULL, -- Protect beginners from high stakes
  max_rating_difference integer NOT NULL DEFAULT 200, -- Max skill gap allowed
  protected boolean NOT NULL DEFAULT true, -- Special protection for novices
  min_matches_required integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create matchmaking preferences with skill considerations
ALTER TABLE public.match_preferences 
ADD COLUMN skill_matching_enabled boolean DEFAULT true,
ADD COLUMN max_skill_gap integer DEFAULT 200,
ADD COLUMN preferred_tiers skill_tier[] DEFAULT '{}',
ADD COLUMN avoid_pros boolean DEFAULT true; -- Beginners can avoid pros

-- Add skill tracking to challenges
ALTER TABLE public.challenges
ADD COLUMN skill_tier_restriction skill_tier[],
ADD COLUMN min_skill_rating integer,
ADD COLUMN max_skill_rating integer,
ADD COLUMN tier_locked boolean DEFAULT false; -- Prevents tier manipulation

-- Enable RLS on new tables
ALTER TABLE public.player_skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_protection_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for skill ratings
CREATE POLICY "Users can view their own skill ratings" 
ON public.player_skill_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view skill ratings for challenges they're in" 
ON public.player_skill_ratings 
FOR SELECT 
USING (
  user_id IN (
    SELECT creator_id FROM challenges WHERE id IN (
      SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
    )
    UNION
    SELECT user_id FROM challenge_participants WHERE challenge_id IN (
      SELECT id FROM challenges WHERE creator_id = auth.uid()
    )
  )
);

CREATE POLICY "Service can manage skill ratings" 
ON public.player_skill_ratings 
FOR ALL 
USING (true);

-- Create policies for tier protection rules
CREATE POLICY "Everyone can view tier protection rules" 
ON public.tier_protection_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tier protection rules" 
ON public.tier_protection_rules 
FOR ALL 
USING (is_user_admin());

-- Create indexes for performance
CREATE INDEX idx_skill_ratings_user_game ON public.player_skill_ratings(user_id, game_id);
CREATE INDEX idx_skill_ratings_tier ON public.player_skill_ratings(skill_tier);
CREATE INDEX idx_skill_ratings_rating ON public.player_skill_ratings(skill_rating);
CREATE INDEX idx_tier_protection_game ON public.tier_protection_rules(game_id, tier);