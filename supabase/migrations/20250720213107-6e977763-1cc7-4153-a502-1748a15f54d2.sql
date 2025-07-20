-- Add fields to track match result reporting and confirmation
ALTER TABLE public.tournament_matches 
ADD COLUMN player1_reported_winner UUID REFERENCES auth.users(id),
ADD COLUMN player2_reported_winner UUID REFERENCES auth.users(id),
ADD COLUMN confirmed_by_organizer BOOLEAN DEFAULT false,
ADD COLUMN result_disputed BOOLEAN DEFAULT false;