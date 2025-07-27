-- Enhance wagers table for multiplayer support
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS wager_type text DEFAULT '1v1'::text;
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS lobby_id text;
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS stat_criteria jsonb;
ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS verification_method text DEFAULT 'manual'::text;

-- Create wager_teams table for team vs team functionality
CREATE TABLE IF NOT EXISTS public.wager_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id uuid NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  team_number integer NOT NULL, -- 1, 2, etc.
  captain_id uuid NOT NULL,
  total_stake numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wager_team_members table for team participants
CREATE TABLE IF NOT EXISTS public.wager_team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.wager_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stake_paid numeric NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'joined'::text
);

-- Create wager_stats table for performance tracking
CREATE TABLE IF NOT EXISTS public.wager_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id uuid NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kills integer DEFAULT 0,
  deaths integer DEFAULT 0,
  assists integer DEFAULT 0,
  score integer DEFAULT 0,
  placement integer, -- for battle royale games
  damage_dealt numeric DEFAULT 0,
  custom_stats jsonb, -- for game-specific stats
  proof_url text, -- screenshot or video proof
  verified boolean DEFAULT false,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lobby_sessions table for shared lobby competitions
CREATE TABLE IF NOT EXISTS public.lobby_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id text NOT NULL UNIQUE,
  game_id uuid NOT NULL REFERENCES public.games(id),
  platform text NOT NULL,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  max_participants integer NOT NULL,
  created_by uuid NOT NULL,
  status text DEFAULT 'active'::text
);

-- Create lobby_participants table
CREATE TABLE IF NOT EXISTS public.lobby_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_session_id uuid NOT NULL REFERENCES public.lobby_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wager_id uuid REFERENCES public.wagers(id),
  joined_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.wager_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wager_teams
CREATE POLICY "Teams viewable by wager participants" ON public.wager_teams
  FOR SELECT USING (
    wager_id IN (
      SELECT id FROM public.wagers WHERE creator_id = auth.uid()
      UNION
      SELECT wager_id FROM public.wager_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team captains can manage teams" ON public.wager_teams
  FOR ALL USING (captain_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.wager_teams
  FOR INSERT WITH CHECK (captain_id = auth.uid());

-- RLS Policies for wager_team_members
CREATE POLICY "Team members viewable by participants" ON public.wager_team_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    team_id IN (
      SELECT id FROM public.wager_teams WHERE captain_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams" ON public.wager_team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their team membership" ON public.wager_team_members
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for wager_stats
CREATE POLICY "Stats viewable by wager participants" ON public.wager_stats
  FOR SELECT USING (
    user_id = auth.uid() OR
    wager_id IN (
      SELECT id FROM public.wagers WHERE creator_id = auth.uid()
      UNION
      SELECT wager_id FROM public.wager_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit their own stats" ON public.wager_stats
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stats" ON public.wager_stats
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for lobby_sessions
CREATE POLICY "Lobby sessions viewable by all" ON public.lobby_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can create lobby sessions" ON public.lobby_sessions
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their lobby sessions" ON public.lobby_sessions
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for lobby_participants
CREATE POLICY "Participants viewable by lobby members" ON public.lobby_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    lobby_session_id IN (
      SELECT id FROM public.lobby_sessions WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join lobbies" ON public.lobby_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_wager_teams_updated_at
  BEFORE UPDATE ON public.wager_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wager_stats_updated_at
  BEFORE UPDATE ON public.wager_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();