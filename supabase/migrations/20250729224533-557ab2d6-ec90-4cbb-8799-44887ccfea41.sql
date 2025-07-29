-- Add unique constraint to automation_type if it doesn't exist
ALTER TABLE automation_config ADD CONSTRAINT automation_config_automation_type_key UNIQUE (automation_type);

-- Insert automation configuration for tournament scheduler
INSERT INTO automation_config (automation_type, is_enabled, run_frequency_minutes, config_data, next_run_at) VALUES 
('tournament_scheduler', true, 60, '{"max_tournaments_per_run": 1}', now()),
('dispute_resolution', true, 30, '{"max_disputes_per_run": 10}', now()),
('dynamic_pricing', true, 15, '{"price_change_threshold": 0.05}', now()),
('fraud_detection', true, 60, '{"lookback_hours": 24}', now()),
('market_making', true, 120, '{"min_challenges_per_game": 3}', now())
ON CONFLICT (automation_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  run_frequency_minutes = EXCLUDED.run_frequency_minutes,
  config_data = EXCLUDED.config_data,
  next_run_at = EXCLUDED.next_run_at;