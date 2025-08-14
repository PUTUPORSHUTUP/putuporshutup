-- Fix sponsor_performance table primary key
alter table public.sponsor_performance
  add column if not exists id uuid default gen_random_uuid();

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sponsor_performance' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.sponsor_performance ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Create covering indexes for hot foreign keys
create index if not exists idx_challenges_creator_id on public.challenges (creator_id);
create index if not exists idx_challenges_game_id on public.challenges (game_id);
create index if not exists idx_challenges_winner_id on public.challenges (winner_id);

-- tournament_matches indexes
create index if not exists idx_tm_player1_id on public.tournament_matches (player1_id);
create index if not exists idx_tm_player2_id on public.tournament_matches (player2_id);
create index if not exists idx_tm_winner_id on public.tournament_matches (winner_id);

-- match_queue indexes
create index if not exists idx_mq_user_id on public.match_queue (user_id);

-- wallet transaction indexes
create index if not exists idx_wallet_tx_user on public.wallet_transactions (user_id);