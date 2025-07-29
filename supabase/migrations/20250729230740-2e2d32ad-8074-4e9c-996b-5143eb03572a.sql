-- Create tournament registrations table
CREATE TABLE public.tournament_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  team_name TEXT,
  skill_rating INTEGER,
  status TEXT NOT NULL DEFAULT 'registered',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  stake_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament registrations
CREATE POLICY "Users can register for tournaments" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view tournament registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_tournament_registrations_updated_at
BEFORE UPDATE ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add tournament status and registration management
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_status TEXT DEFAULT 'registration_open';

-- Create function to update participant count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments 
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_participants = GREATEST(current_participants - 1, 0),
        updated_at = now()
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update participant count
CREATE TRIGGER tournament_participant_count_trigger
AFTER INSERT OR DELETE ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION update_tournament_participant_count();