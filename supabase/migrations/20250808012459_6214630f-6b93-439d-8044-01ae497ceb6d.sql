-- =========================
-- CORE SAFETY MIGRATION (Fixed)
-- =========================

-- A) Matches can only be settled once
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS settled BOOLEAN DEFAULT FALSE;

-- B) Unique guard so the same player can't join the same match twice
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uq_match_player' 
    AND table_name = 'match_queue'
  ) THEN
    ALTER TABLE match_queue ADD CONSTRAINT uq_match_player UNIQUE (match_id, player_id);
  END IF;
END $$;

-- C) Wallet transaction audit
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  match_id UUID,
  amount NUMERIC NOT NULL,           -- +credit / -debit
  reason TEXT NOT NULL,              -- 'entry_debit' | 'payout' | 'refund'
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- D) Safe wallet increment
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_profile_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance,0) + p_amount
  WHERE id = p_profile_id;

  INSERT INTO wallet_transactions(profile_id, amount, reason)
  VALUES (p_profile_id, p_amount, CASE WHEN p_amount >= 0 THEN 'payout' ELSE 'debit' END);
END;
$$;

-- E) ATOMIC join: insert queue row ONCE and debit wallet IF inserted & sufficient
CREATE OR REPLACE FUNCTION join_queue_atomic(
  p_match_id UUID,
  p_player_id UUID,
  p_game TEXT,
  p_mode TEXT,
  p_entry_fee NUMERIC
) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  did_insert BOOLEAN := FALSE;
  updated_rows INT;
BEGIN
  -- 1) Try to insert queue row (idempotent via unique constraint)
  INSERT INTO match_queue (match_id, player_id, game_title, mode, status, entry_fee, is_test)
  VALUES (p_match_id, p_player_id, p_game, p_mode, 'queued', p_entry_fee, TRUE)
  ON CONFLICT (match_id, player_id) DO NOTHING;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  did_insert := (updated_rows = 1);

  IF NOT did_insert THEN
    RETURN 'already_joined';
  END IF;

  -- 2) Try to debit wallet ONLY if sufficient balance
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_entry_fee
  WHERE id = p_player_id
    AND COALESCE(wallet_balance,0) >= p_entry_fee;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    -- Not enough balance -> rollback queue row
    DELETE FROM match_queue WHERE match_id = p_match_id AND player_id = p_player_id;
    RETURN 'insufficient_funds';
  END IF;

  -- 3) Audit trail
  INSERT INTO wallet_transactions(profile_id, match_id, amount, reason)
  VALUES (p_player_id, p_match_id, -p_entry_fee, 'entry_debit');

  RETURN 'joined';
END;
$$;

-- F) Helper to guard "process once" (payouts/refunds)
CREATE OR REPLACE FUNCTION mark_match_settled(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
  changed INT;
BEGIN
  UPDATE matches
  SET settled = TRUE
  WHERE id = p_match_id AND settled = FALSE;

  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1; -- TRUE if we flipped it to settled (i.e., first/only time)
END;
$$;

-- G) Find stuck matches (> p_minutes in 'launching', no start)
CREATE OR REPLACE FUNCTION find_stuck_matches(p_minutes INT)
RETURNS SETOF matches
LANGUAGE sql AS $$
  SELECT *
  FROM matches
  WHERE state = 'launching'
    AND started_at IS NULL
    AND created_at < (now() - (p_minutes || ' minutes')::interval)
    AND settled = FALSE;
$$;