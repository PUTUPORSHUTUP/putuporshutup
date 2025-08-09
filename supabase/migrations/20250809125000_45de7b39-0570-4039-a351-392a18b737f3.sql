-- Insert test data into match_queue
insert into match_queue (user_id, game_key, stake_cents, status)
values
  (gen_random_uuid(), 'COD6:KILL_RACE', 500, 'waiting'),
  (gen_random_uuid(), 'COD6:KILL_RACE', 500, 'waiting');

-- Insert wallet balances for the test users
insert into wallets (user_id, balance_cents)
select user_id, 1000 from match_queue where status='waiting'
on conflict (user_id) do update set balance_cents = excluded.balance_cents;

-- Run the database market engine
select db_market_run(true);