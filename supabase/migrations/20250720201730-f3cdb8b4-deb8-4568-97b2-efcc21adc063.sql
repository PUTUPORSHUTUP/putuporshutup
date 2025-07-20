-- Create games table for supported games
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  platform TEXT[], -- e.g., ['PS5', 'Xbox', 'PC']
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wagers table for betting challenges
CREATE TABLE public.wagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stake_amount DECIMAL(10,2) NOT NULL,
  max_participants INTEGER DEFAULT 2,
  platform TEXT NOT NULL,
  game_mode TEXT, -- e.g., '1v1', 'Tournament', 'Best of 3'
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES auth.users(id),
  total_pot DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wager participants table
CREATE TABLE public.wager_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id UUID NOT NULL REFERENCES public.wagers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stake_paid DECIMAL(10,2) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'ready', 'completed')),
  UNIQUE(wager_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wager_participants ENABLE ROW LEVEL SECURITY;

-- Games policies (readable by everyone)
CREATE POLICY "Games are viewable by everyone" 
ON public.games 
FOR SELECT 
USING (true);

-- Wagers policies
CREATE POLICY "Wagers are viewable by everyone" 
ON public.wagers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create wagers" 
ON public.wagers 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their wagers" 
ON public.wagers 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Wager participants policies
CREATE POLICY "Participants viewable by wager participants" 
ON public.wager_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.wagers w 
    WHERE w.id = wager_id AND w.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can join wagers" 
ON public.wager_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" 
ON public.wager_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert some initial games
INSERT INTO public.games (name, display_name, description, platform) VALUES
('madden24', 'MADDEN 24', 'NFL simulation game', ARRAY['PS5', 'Xbox', 'PC']),
('nba2k24', 'NBA 2K24', 'Basketball simulation game', ARRAY['PS5', 'Xbox', 'PC']),
('cod_mw3', 'Call of Duty: MW3', 'First-person shooter', ARRAY['PS5', 'Xbox', 'PC']),
('fifa24', 'FIFA 24', 'Soccer simulation game', ARRAY['PS5', 'Xbox', 'PC']),
('fortnite', 'Fortnite', 'Battle royale game', ARRAY['PS5', 'Xbox', 'PC', 'Mobile']),
('apex_legends', 'Apex Legends', 'Battle royale shooter', ARRAY['PS5', 'Xbox', 'PC']);

-- Trigger for updating timestamps
CREATE TRIGGER update_wagers_updated_at
  BEFORE UPDATE ON public.wagers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();