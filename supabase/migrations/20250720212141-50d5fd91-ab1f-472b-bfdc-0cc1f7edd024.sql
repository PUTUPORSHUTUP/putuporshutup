-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entry_fee DECIMAL(10,2) NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants IN (4, 8, 16, 32)),
  current_participants INTEGER DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_paid DECIMAL(10,2) NOT NULL,
  eliminated_at TIMESTAMPTZ,
  bracket_position INTEGER NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id),
  UNIQUE(tournament_id, bracket_position)
);

-- Create tournament matches table (for bracket system)
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  scheduled_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, round_number, match_number)
);

-- Enable Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Tournament policies
CREATE POLICY "tournaments_viewable_by_all" ON public.tournaments
FOR SELECT USING (true);

CREATE POLICY "users_can_create_tournaments" ON public.tournaments
FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "creators_can_update_tournaments" ON public.tournaments
FOR UPDATE USING (auth.uid() = creator_id);

-- Participant policies
CREATE POLICY "participants_viewable_by_tournament_members" ON public.tournament_participants
FOR SELECT USING (
  user_id = auth.uid() OR 
  tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
);

CREATE POLICY "users_can_join_tournaments" ON public.tournament_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Match policies
CREATE POLICY "matches_viewable_by_tournament_members" ON public.tournament_matches
FOR SELECT USING (
  player1_id = auth.uid() OR 
  player2_id = auth.uid() OR 
  tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
);

CREATE POLICY "tournament_creators_can_manage_matches" ON public.tournament_matches
FOR ALL USING (
  tournament_id IN (SELECT id FROM tournaments WHERE creator_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_game_id ON public.tournaments(game_id);
CREATE INDEX idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round ON public.tournament_matches(tournament_id, round_number);