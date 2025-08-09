-- Insert test data into match_queue with correct column names
INSERT INTO match_queue (user_id, game_id, platform, stake_amount, queue_status, queued_at, expires_at)
VALUES
  (gen_random_uuid(), 'a39ff069-f19e-4d56-b522-81601ad60cee'::uuid, 'Xbox', 5.00, 'searching', now(), now() + interval '10 minutes'),
  (gen_random_uuid(), 'a39ff069-f19e-4d56-b522-81601ad60cee'::uuid, 'Xbox', 5.00, 'searching', now(), now() + interval '10 minutes');

-- Insert wallet balances for the test users 
INSERT INTO wallets (user_id, balance_cents)
SELECT user_id, 1000 FROM match_queue WHERE queue_status = 'searching'
ON CONFLICT (user_id) DO UPDATE SET balance_cents = excluded.balance_cents;

-- Run the database market engine
SELECT db_market_run(true);