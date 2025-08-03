-- Create tournament_entries table for Sunday Showdown registrations
CREATE TABLE public.tournament_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tournament_id TEXT NOT NULL,
  email TEXT NOT NULL,
  gamertag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own entries" 
ON public.tournament_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
ON public.tournament_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all entries
CREATE POLICY "Admins can view all entries" 
ON public.tournament_entries 
FOR SELECT 
USING (is_user_admin());