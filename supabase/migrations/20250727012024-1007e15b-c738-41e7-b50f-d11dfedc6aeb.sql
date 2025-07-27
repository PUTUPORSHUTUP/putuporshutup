-- Check and add only missing columns to wagers table
DO $$ 
BEGIN
    -- Add team_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wagers' AND column_name = 'team_size') THEN
        ALTER TABLE public.wagers ADD COLUMN team_size integer;
    END IF;
    
    -- Add lobby_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wagers' AND column_name = 'lobby_id') THEN
        ALTER TABLE public.wagers ADD COLUMN lobby_id text;
    END IF;
    
    -- Add stat_criteria column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wagers' AND column_name = 'stat_criteria') THEN
        ALTER TABLE public.wagers ADD COLUMN stat_criteria jsonb;
    END IF;
    
    -- Add verification_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wagers' AND column_name = 'verification_method') THEN
        ALTER TABLE public.wagers ADD COLUMN verification_method text NOT NULL DEFAULT 'manual';
    END IF;
END $$;

-- Create wager_teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wager_teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id uuid NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  team_number integer NOT NULL,
  captain_id uuid NOT NULL,
  total_stake numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create wager_team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wager_team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.wager_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stake_paid numeric NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'
);

-- Create wager_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wager_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id uuid NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kills integer DEFAULT 0,
  deaths integer DEFAULT 0,
  assists integer DEFAULT 0,
  score integer DEFAULT 0,
  placement integer,
  damage_dealt integer DEFAULT 0,
  custom_stats jsonb,
  proof_url text,
  verified boolean DEFAULT false,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lobby_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lobby_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id text NOT NULL,
  game_id uuid NOT NULL,
  platform text NOT NULL,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  max_participants integer NOT NULL,
  created_by uuid NOT NULL,
  status text DEFAULT 'active'
);

-- Create lobby_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lobby_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_session_id uuid NOT NULL REFERENCES public.lobby_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  wager_id uuid REFERENCES public.wagers(id) ON DELETE SET NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.wager_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wager_teams (with IF NOT EXISTS check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_teams' AND policyname = 'Team members can view their teams') THEN
        CREATE POLICY "Team members can view their teams" 
        ON public.wager_teams 
        FOR SELECT 
        USING (
          captain_id = auth.uid() OR 
          id IN (
            SELECT team_id FROM public.wager_team_members 
            WHERE user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_teams' AND policyname = 'Captains can create teams') THEN
        CREATE POLICY "Captains can create teams" 
        ON public.wager_teams 
        FOR INSERT 
        WITH CHECK (captain_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_teams' AND policyname = 'Captains can update their teams') THEN
        CREATE POLICY "Captains can update their teams" 
        ON public.wager_teams 
        FOR UPDATE 
        USING (captain_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for wager_team_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_team_members' AND policyname = 'Team members viewable by team members') THEN
        CREATE POLICY "Team members viewable by team members" 
        ON public.wager_team_members 
        FOR SELECT 
        USING (
          user_id = auth.uid() OR 
          team_id IN (
            SELECT id FROM public.wager_teams 
            WHERE captain_id = auth.uid()
          ) OR
          team_id IN (
            SELECT team_id FROM public.wager_team_members 
            WHERE user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_team_members' AND policyname = 'Users can join teams') THEN
        CREATE POLICY "Users can join teams" 
        ON public.wager_team_members 
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_team_members' AND policyname = 'Members can update their status') THEN
        CREATE POLICY "Members can update their status" 
        ON public.wager_team_members 
        FOR UPDATE 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for wager_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_stats' AND policyname = 'Stats viewable by wager participants') THEN
        CREATE POLICY "Stats viewable by wager participants" 
        ON public.wager_stats 
        FOR SELECT 
        USING (
          user_id = auth.uid() OR 
          wager_id IN (
            SELECT id FROM public.wagers 
            WHERE creator_id = auth.uid()
          ) OR
          wager_id IN (
            SELECT wager_id FROM public.wager_participants 
            WHERE user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_stats' AND policyname = 'Users can create their own stats') THEN
        CREATE POLICY "Users can create their own stats" 
        ON public.wager_stats 
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wager_stats' AND policyname = 'Users can update their own stats') THEN
        CREATE POLICY "Users can update their own stats" 
        ON public.wager_stats 
        FOR UPDATE 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for lobby_sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lobby_sessions' AND policyname = 'Lobby sessions viewable by all') THEN
        CREATE POLICY "Lobby sessions viewable by all" 
        ON public.lobby_sessions 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lobby_sessions' AND policyname = 'Users can create lobby sessions') THEN
        CREATE POLICY "Users can create lobby sessions" 
        ON public.lobby_sessions 
        FOR INSERT 
        WITH CHECK (created_by = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lobby_sessions' AND policyname = 'Creators can update their lobby sessions') THEN
        CREATE POLICY "Creators can update their lobby sessions" 
        ON public.lobby_sessions 
        FOR UPDATE 
        USING (created_by = auth.uid());
    END IF;
END $$;

-- Create RLS policies for lobby_participants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lobby_participants' AND policyname = 'Participants viewable by lobby members') THEN
        CREATE POLICY "Participants viewable by lobby members" 
        ON public.lobby_participants 
        FOR SELECT 
        USING (
          user_id = auth.uid() OR 
          lobby_session_id IN (
            SELECT id FROM public.lobby_sessions 
            WHERE created_by = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lobby_participants' AND policyname = 'Users can join lobbies') THEN
        CREATE POLICY "Users can join lobbies" 
        ON public.lobby_participants 
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Add updated_at triggers for new tables (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_wager_teams_updated_at') THEN
        CREATE TRIGGER update_wager_teams_updated_at
          BEFORE UPDATE ON public.wager_teams
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_wager_stats_updated_at') THEN
        CREATE TRIGGER update_wager_stats_updated_at
          BEFORE UPDATE ON public.wager_stats
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;