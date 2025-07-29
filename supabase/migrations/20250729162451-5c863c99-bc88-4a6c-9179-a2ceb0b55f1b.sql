-- Add richer game configuration fields to game_matrix table
ALTER TABLE public.game_matrix 
ADD COLUMN game_modes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN setup_guide text,
ADD COLUMN result_submission boolean DEFAULT true,
ADD COLUMN proof_type text DEFAULT 'screenshot',
ADD COLUMN result_options jsonb DEFAULT '["1st Place", "2nd Place", "3rd Place", "Lost"]'::jsonb,
ADD COLUMN timeout_failsafe boolean DEFAULT true,
ADD COLUMN dispute_handler boolean DEFAULT true,
ADD COLUMN show_timer boolean DEFAULT true,
ADD COLUMN match_type jsonb DEFAULT '[]'::jsonb;

-- Update existing games with sample rich configurations
UPDATE public.game_matrix 
SET 
  game_modes = '["Search & Destroy", "Domination", "Team Deathmatch", "Hardpoint"]'::jsonb,
  setup_guide = 'To create a private match, go to Multiplayer > Custom Game > Create Lobby. Share the lobby code with other players.',
  result_submission = true,
  proof_type = 'screenshot',
  result_options = '["1st Place", "2nd Place", "3rd Place", "Lost"]'::jsonb,
  timeout_failsafe = true,
  dispute_handler = true,
  show_timer = true,
  match_type = '["Solo", "Duo", "Squad"]'::jsonb
WHERE game = 'Call of Duty: Black Ops 6';

UPDATE public.game_matrix 
SET 
  game_modes = '["Battle Royale", "Plunder", "Resurgence"]'::jsonb,
  setup_guide = 'Create a private lobby in Warzone and share the lobby code. Make sure all players join before starting the match.',
  result_submission = true,
  proof_type = 'screenshot',
  result_options = '["Victory", "Top 5", "Top 10", "Eliminated"]'::jsonb,
  timeout_failsafe = true,
  dispute_handler = true,
  show_timer = true,
  match_type = '["Solo", "Duo", "Trio", "Quad"]'::jsonb
WHERE game = 'Call of Duty: Warzone';

UPDATE public.game_matrix 
SET 
  game_modes = '["Battle Royale", "Arena", "Control"]'::jsonb,
  setup_guide = 'Create a custom lobby in Apex Legends. Go to Lobby > Custom Game > Create Match. Share the lobby code.',
  result_submission = true,
  proof_type = 'screenshot',
  result_options = '["Champion", "Top 3", "Top 5", "Eliminated"]'::jsonb,
  timeout_failsafe = true,
  dispute_handler = true,
  show_timer = true,
  match_type = '["Solo", "Duo", "Trio"]'::jsonb
WHERE game = 'Apex Legends';

UPDATE public.game_matrix 
SET 
  game_modes = '["Battle Royale", "Zero Build", "Creative"]'::jsonb,
  setup_guide = 'Create a custom lobby in Fortnite Creative. Share the island code with other players to join.',
  result_submission = true,
  proof_type = 'screenshot',
  result_options = '["Victory Royale", "Top 5", "Top 10", "Eliminated"]'::jsonb,
  timeout_failsafe = true,
  dispute_handler = true,
  show_timer = true,
  match_type = '["Solo", "Duo", "Trio", "Squad"]'::jsonb
WHERE game = 'Fortnite';

-- Update remaining games with default configurations
UPDATE public.game_matrix 
SET 
  game_modes = '["Standard", "Ranked", "Custom"]'::jsonb,
  setup_guide = COALESCE(setup_instructions, 'Create a custom lobby and share the join details with other players.'),
  result_submission = true,
  proof_type = CASE WHEN api_access THEN 'api' ELSE 'screenshot' END,
  result_options = '["Winner", "Runner-up", "Lost"]'::jsonb,
  timeout_failsafe = true,
  dispute_handler = true,
  show_timer = true,
  match_type = '["1v1", "Team"]'::jsonb
WHERE game_modes IS NULL;