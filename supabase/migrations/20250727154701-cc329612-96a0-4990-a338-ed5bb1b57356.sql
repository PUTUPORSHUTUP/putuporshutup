-- Create game_matrix table for centralized game configuration
CREATE TABLE public.game_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game TEXT NOT NULL UNIQUE,
  platforms TEXT NOT NULL,
  proof_method TEXT NOT NULL DEFAULT 'Manual',
  challenge_type TEXT NOT NULL,
  api_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_matrix ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Game matrix is viewable by everyone" 
ON public.game_matrix 
FOR SELECT 
USING (true);

-- Create policy for admin management
CREATE POLICY "Admins can manage game matrix" 
ON public.game_matrix 
FOR ALL 
USING (is_user_admin());

-- Insert initial game data
INSERT INTO public.game_matrix (game, platforms, proof_method, challenge_type, api_access) VALUES
  ('Call of Duty: Cold War', 'PlayStation, Xbox, PC', 'API', '1v1, Kill Race, Team vs Team', true),
  ('FIFA 21', 'PlayStation, Xbox, PC, Nintendo Switch', 'API', '1v1, Tournament', true),
  ('Fortnite', 'PlayStation, Xbox, PC, Nintendo Switch, Mobile', 'API', '1v1, Kill Race, Squad vs Squad', true),
  ('Apex Legends', 'PlayStation, Xbox, PC', 'API', '1v1, Kill Race, Team vs Team', true),
  ('Rocket League', 'PlayStation, Xbox, PC, Nintendo Switch', 'Manual', '1v1, Team vs Team, Tournament', false),
  ('Counter-Strike 2', 'PC', 'API', '1v1, Team vs Team, Tournament', true),
  ('Valorant', 'PC', 'Manual', '1v1, Team vs Team, Tournament', false),
  ('League of Legends', 'PC', 'API', '1v1, Team vs Team, Tournament', true),
  ('Overwatch 2', 'PlayStation, Xbox, PC, Nintendo Switch', 'Manual', '1v1, Team vs Team, Tournament', false),
  ('Minecraft', 'PlayStation, Xbox, PC, Nintendo Switch, Mobile', 'Manual', '1v1, Creative Challenge', false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_matrix_updated_at
BEFORE UPDATE ON public.game_matrix
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();