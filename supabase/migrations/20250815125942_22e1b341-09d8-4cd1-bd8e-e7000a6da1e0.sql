-- Create a test automated match manually to demonstrate the system
INSERT INTO public.match_queue (
  queue_status,
  entry_fee,
  platform,
  payout_type,
  vip_required,
  automated,
  queued_at,
  expires_at,
  user_id,
  game_id
) VALUES (
  'searching',
  1.00,
  'Xbox',
  'winner_take_all',
  false,
  true,
  now(),
  now() + interval '30 minutes',
  '12da340a-464a-4987-bac9-c69b546312ed',
  'a39ff069-f19e-4d56-b522-81601ad60cee'
);