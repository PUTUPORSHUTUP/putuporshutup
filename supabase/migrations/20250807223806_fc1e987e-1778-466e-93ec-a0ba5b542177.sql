-- Profiles: add wallet & vip fields if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_trial_start TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Create matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT DEFAULT 'pending',              -- 'pending' | 'launching' | 'active' | 'completed' | 'failed'
  ruleset TEXT DEFAULT 'STANDARD',           -- 'STANDARD' | 'SUNDAY_SHOWDOWN'
  payout_type TEXT DEFAULT 'TOP_3',          -- 'TOP_3' | 'WINNER_TAKE_ALL'
  lobby_code TEXT,
  created_at TIMESTAMP DEFAULT now(),
  started_at TIMESTAMP,
  failed_to_launch BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  is_test BOOLEAN DEFAULT FALSE
);

-- Add columns to existing matches table if they don't exist
ALTER TABLE matches ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'pending';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS ruleset TEXT DEFAULT 'STANDARD';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS payout_type TEXT DEFAULT 'TOP_3';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS lobby_code TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS failed_to_launch BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- match_queue: add missing columns
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS player_id UUID;
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS game_title TEXT;
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS mode TEXT;
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued';
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS match_id UUID;
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 5;
ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- match_results: stores results per player per match
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  player_id UUID NOT NULL,
  placement INT,
  kills INT,
  created_at TIMESTAMP DEFAULT now(),
  is_test BOOLEAN DEFAULT FALSE
);

-- payout automation log
CREATE TABLE IF NOT EXISTS payout_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  payout_amount NUMERIC,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- TEST SEED: 8 fake profiles with $50 (safe if you re-run)
INSERT INTO profiles (user_id, username, display_name, xbox_gamertag, wallet_balance, is_test_account)
VALUES
('00000000-0000-0000-0000-000000000001','player1_test','P1_Titan','P1_Titan',50,true),
('00000000-0000-0000-0000-000000000002','player2_test','P2_Apex','P2_Apex',50,true),
('00000000-0000-0000-0000-000000000003','player3_test','P3_Rocket','P3_Rocket',50,true),
('00000000-0000-0000-0000-000000000004','player4_test','P4_War','P4_War',50,true),
('00000000-0000-0000-0000-000000000005','player5_test','P5_Snipe','P5_Snipe',50,true),
('00000000-0000-0000-0000-000000000006','player6_test','P6_Dash','P6_Dash',50,true),
('00000000-0000-0000-0000-000000000007','player7_test','P7_Clutch','P7_Clutch',50,true),
('00000000-0000-0000-0000-000000000008','player8_test','P8_Rush','P8_Rush',50,true)
ON CONFLICT (user_id) DO UPDATE SET
  wallet_balance = EXCLUDED.wallet_balance,
  is_test_account = EXCLUDED.is_test_account;

-- increment_wallet_balance(user_id, amount)
CREATE OR REPLACE FUNCTION increment_wallet_balance(user_id_param UUID, amount_param NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance,0) + amount_param,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$;

-- find_stuck_matches(p_minutes int)
CREATE OR REPLACE FUNCTION find_stuck_matches(p_minutes INT)
RETURNS SETOF matches
LANGUAGE sql
AS $$
  SELECT *
  FROM matches
  WHERE state = 'launching'
    AND started_at IS NULL
    AND created_at < (now() - (p_minutes || ' minutes')::interval);
$$;