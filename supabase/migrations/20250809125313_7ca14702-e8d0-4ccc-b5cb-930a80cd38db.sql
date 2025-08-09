-- Insert test data into match_queue using existing user IDs
INSERT INTO match_queue (user_id, game_id, platform, stake_amount, queue_status, queued_at, expires_at)
VALUES
  ('12da340a-464a-4987-bac9-c69b546312ed'::uuid, 'a39ff069-f19e-4d56-b522-81601ad60cee'::uuid, 'Xbox', 5.00, 'searching', now(), now() + interval '10 minutes'),
  ('244947fb-30f8-4664-ae27-ec08cecae5c4'::uuid, 'a39ff069-f19e-4d56-b522-81601ad60cee'::uuid, 'Xbox', 5.00, 'searching', now(), now() + interval '10 minutes');

-- Insert wallet balances for the test users 
INSERT INTO wallets (user_id, balance_cents)
SELECT user_id, 1000 FROM match_queue WHERE queue_status = 'searching'
ON CONFLICT (user_id) DO UPDATE SET balance_cents = excluded.balance_cents;

-- Run the database market engine
SELECT db_market_run(true);