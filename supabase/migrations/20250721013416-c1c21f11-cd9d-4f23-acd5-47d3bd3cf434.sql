-- Enable real-time functionality for notifications
-- Add tables to the supabase_realtime publication

-- Set REPLICA IDENTITY FULL for all tables to ensure complete row data is captured
ALTER TABLE public.wagers REPLICA IDENTITY FULL;
ALTER TABLE public.wager_participants REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_participants REPLICA IDENTITY FULL;
ALTER TABLE public.disputes REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add tables to the realtime publication to enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.wagers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wager_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;