-- Replace the security definer view with a regular view
DROP VIEW IF EXISTS public.v_joinable_matches;

CREATE VIEW public.v_joinable_matches AS
SELECT mq.*
FROM match_queue mq
WHERE (mq.entry_fee <= COALESCE((
  SELECT wallet_balance 
  FROM profiles 
  WHERE user_id = auth.uid()
), 0))
AND (mq.vip_required IS false OR COALESCE((
  SELECT is_vip 
  FROM profiles 
  WHERE user_id = auth.uid()
), false) IS true);