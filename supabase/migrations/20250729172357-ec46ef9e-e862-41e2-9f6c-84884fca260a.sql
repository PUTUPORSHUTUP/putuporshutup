-- Add additional game rule fields to game_matrix table
ALTER TABLE public.game_matrix 
ADD COLUMN IF NOT EXISTS allowed_proof_types jsonb DEFAULT '["Screenshot"]'::jsonb,
ADD COLUMN IF NOT EXISTS auto_forfeit_minutes integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS detailed_notes text DEFAULT NULL;

-- Update existing games with sample data
UPDATE public.game_matrix 
SET 
  allowed_proof_types = '["Screenshot", "Twitch Clip", "YouTube Clip"]'::jsonb,
  auto_forfeit_minutes = 10,
  detailed_notes = 'Kill count determines winner. No teaming allowed.'
WHERE game = 'Fortnite';

UPDATE public.game_matrix 
SET 
  allowed_proof_types = '["Screenshot", "Stream Clip"]'::jsonb,
  auto_forfeit_minutes = 10,
  detailed_notes = 'Kills matter most. Ties go to the earliest submission.'
WHERE game = 'Call of Duty: Warzone';

UPDATE public.game_matrix 
SET 
  allowed_proof_types = '["Scoreboard Screenshot", "Stream Replay"]'::jsonb,
  auto_forfeit_minutes = 10,
  detailed_notes = 'Host must set correct rules. No class restrictions unless agreed upon.'
WHERE game = 'COD: Black Ops 6 Multiplayer';