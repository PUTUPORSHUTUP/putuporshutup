-- Update existing games to latest versions
UPDATE games 
SET 
  display_name = 'Call of Duty: Black Ops 6',
  name = 'cod_bo6',
  description = 'Latest Call of Duty first-person shooter'
WHERE name = 'cod_mw3';

UPDATE games 
SET 
  display_name = 'FIFA 25',
  name = 'fifa25',
  description = 'Latest soccer simulation game'
WHERE name = 'fifa24';

UPDATE games 
SET 
  display_name = 'MADDEN 25',
  name = 'madden25',
  description = 'Latest NFL simulation game'
WHERE name = 'madden24';

UPDATE games 
SET 
  display_name = 'NBA 2K25',
  name = 'nba2k25',
  description = 'Latest basketball simulation game'
WHERE name = 'nba2k24';

-- Create game suggestions table for member suggestions
CREATE TABLE public.game_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  platform TEXT[] NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.game_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game suggestions
CREATE POLICY "Users can view all suggestions" 
ON public.game_suggestions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create suggestions" 
ON public.game_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" 
ON public.game_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_game_suggestions_updated_at
BEFORE UPDATE ON public.game_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();