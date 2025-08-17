-- Create a test automated match directly
INSERT INTO public.match_queue (
  user_id,
  stake_amount,
  game_id,
  platform,
  queue_status,
  queued_at,
  expires_at,
  entry_fee,
  payout_type,
  vip_required,
  automated,
  game_mode_key
) VALUES (
  '12da340a-464a-4987-bac9-c69b546312ed',
  1.00,
  'a39ff069-f19e-4d56-b522-81601ad60cee',
  'Xbox',
  'searching',
  now(),
  now() + interval '30 minutes',
  1.00,
  'winner_take_all',
  false,
  true,
  'competitive'
);

-- Update the rotation state
UPDATE public.match_cycle_state 
SET idx = 1, last_created = now() 
WHERE id = 1;