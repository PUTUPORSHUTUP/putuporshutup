-- Extend game_matrix with new automation-ready fields
ALTER TABLE game_matrix 
ADD COLUMN IF NOT EXISTS automated_score_detection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS host_verification_method TEXT DEFAULT 'screenshot', 
ADD COLUMN IF NOT EXISTS requires_host_verification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trend_score INTEGER DEFAULT 0;

-- Insert or update top games with support for upcoming automation features
INSERT INTO game_matrix (
  game, 
  platforms,
  challenge_type,
  proof_method,
  api_access,
  setup_instructions, 
  allowed_proof_types, 
  result_options,
  auto_forfeit_minutes, 
  cross_platform_supported, 
  max_players, 
  automated_score_detection, 
  host_verification_method, 
  requires_host_verification,
  trend_score
) VALUES 
('Rocket League', 'PC, PlayStation, Xbox, Nintendo Switch', '1v1, 2v2, 3v3', 'Manual', false, 'Create private match, set name/password, invite opponent.', '["screenshot","video"]'::jsonb, '["1st Place","2nd Place","3rd Place","Lost"]'::jsonb, 10, true, 6, false, 'screenshot', true, 82),
('NBA 2K25', 'PC, PlayStation, Xbox', '1v1', 'Manual', false, 'Use Online Versus or MyNBA match. Invite opponent using gamertag.', '["screenshot","stream"]'::jsonb, '["Winner","Lost"]'::jsonb, 10, true, 2, true, 'webcam', true, 89),
('Madden NFL 25', 'PC, PlayStation, Xbox', '1v1', 'Manual', false, 'Create Head-to-Head Online match. Share game ID with opponent.', '["screenshot","stream"]'::jsonb, '["Winner","Lost"]'::jsonb, 10, true, 2, true, 'webcam', true, 88),
('WWE 2K25', 'PC, PlayStation, Xbox', '1v1', 'Manual', false, 'Create Private Lobby. Invite opponent from friends list.', '["screenshot","video"]'::jsonb, '["Winner","Lost"]'::jsonb, 10, true, 2, false, 'screenshot', true, 86),
('Call of Duty: Black Ops 6', 'PC, PlayStation, Xbox', '1v1, 2v2, Team vs Team', 'Manual', false, 'Use custom game lobby. Set rules and invite.', '["screenshot","stream"]'::jsonb, '["Winner","Lost"]'::jsonb, 5, true, 12, true, 'stream', true, 95)
ON CONFLICT (game) DO UPDATE SET 
  trend_score = EXCLUDED.trend_score,
  setup_instructions = EXCLUDED.setup_instructions,
  allowed_proof_types = EXCLUDED.allowed_proof_types,
  result_options = EXCLUDED.result_options,
  auto_forfeit_minutes = EXCLUDED.auto_forfeit_minutes,
  cross_platform_supported = EXCLUDED.cross_platform_supported,
  max_players = EXCLUDED.max_players,
  automated_score_detection = EXCLUDED.automated_score_detection,
  host_verification_method = EXCLUDED.host_verification_method,
  requires_host_verification = EXCLUDED.requires_host_verification;