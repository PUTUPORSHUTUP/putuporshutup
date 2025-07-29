-- Add cover art and enhanced naming to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN cover_art_url text,
ADD COLUMN poster_title text,
ADD COLUMN collectible_series text DEFAULT 'Auto Championship Series',
ADD COLUMN season_number integer DEFAULT 1,
ADD COLUMN episode_number integer DEFAULT 1;

-- Add cover art and naming templates to tournament templates
ALTER TABLE public.tournament_templates
ADD COLUMN cover_art_url text,
ADD COLUMN poster_title_template text DEFAULT '{game_name} {series} #{episode}',
ADD COLUMN collectible_series text DEFAULT 'Championship Series',
ADD COLUMN title_variations jsonb DEFAULT '["Championship", "Showdown", "Elite Cup", "Masters", "Pro League"]'::jsonb;

-- Create a sequence for episode numbering
CREATE SEQUENCE tournament_episode_seq START 1;

-- Create tournament poster collection tracking table
CREATE TABLE public.tournament_posters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES tournaments(id),
  poster_title text NOT NULL,
  cover_art_url text NOT NULL,
  series_name text NOT NULL,
  season_number integer NOT NULL,
  episode_number integer NOT NULL,
  rarity_level text DEFAULT 'common',
  mint_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tournament posters
ALTER TABLE public.tournament_posters ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament posters
CREATE POLICY "Tournament posters are viewable by everyone" 
ON public.tournament_posters 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage tournament posters" 
ON public.tournament_posters 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_tournament_posters_series ON public.tournament_posters(series_name, season_number, episode_number);
CREATE INDEX idx_tournament_posters_tournament ON public.tournament_posters(tournament_id);