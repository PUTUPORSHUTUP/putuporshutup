-- 1) Store rotation pointer
CREATE TABLE IF NOT EXISTS public.match_cycle_state (
  id int PRIMARY KEY DEFAULT 1,
  idx int NOT NULL DEFAULT 0,           -- 0=$1, 1=$5, 2=$10 VIP
  last_created timestamptz
);

INSERT INTO public.match_cycle_state (id, idx)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 2) Make sure match_queue has what we need
ALTER TABLE public.match_queue
  ADD COLUMN IF NOT EXISTS entry_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_type text DEFAULT 'winner_take_all',
  ADD COLUMN IF NOT EXISTS vip_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS automated boolean DEFAULT false;

-- Helper view for joinable matches
CREATE OR REPLACE VIEW public.v_joinable_matches AS
SELECT mq.*
FROM match_queue mq
JOIN profiles p ON p.user_id = auth.uid()
WHERE (mq.entry_fee <= COALESCE(p.wallet_balance, 0))
  AND (mq.vip_required IS false OR COALESCE(p.is_vip, false) IS true);

-- Helper function to close stale matches
CREATE OR REPLACE FUNCTION public.close_stale_matches() 
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  UPDATE public.match_queue
  SET status = 'closed'
  WHERE automated IS true
    AND status = 'open'
    AND now() > COALESCE(expires_at, now());
END $$;