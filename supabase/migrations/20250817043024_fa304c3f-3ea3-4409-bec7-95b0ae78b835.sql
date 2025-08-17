-- Clean up old matches and create a dedicated automated match
-- Delete old matches that are blocking automated matches
DELETE FROM public.match_queue 
WHERE queue_status = 'searching' AND automated = false;

-- Create a test automated match with a different approach
-- Use a generated UUID for automated matches to avoid conflicts
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
  gen_random_uuid(), -- Generate unique UUID for each automated match
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

-- Update the rotation state to indicate we've created the $1 match
UPDATE public.match_cycle_state 
SET idx = 1, last_created = now() 
WHERE id = 1;