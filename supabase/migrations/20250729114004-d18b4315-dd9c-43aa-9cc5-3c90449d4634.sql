-- Create tournament announcements table for premium users
CREATE TABLE public.tournament_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 32,
  game_id UUID,
  platform TEXT NOT NULL,
  prize_details TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sponsored tournaments table for automated tournaments
CREATE TABLE public.sponsored_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL DEFAULT 'PUOSU',
  tournament_type TEXT NOT NULL, -- 'sunday_showdown', 'daily_bronze', etc.
  title TEXT NOT NULL,
  description TEXT,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  prize_pool NUMERIC NOT NULL DEFAULT 0,
  max_participants INTEGER NOT NULL DEFAULT 32,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  game_id UUID,
  platform TEXT NOT NULL DEFAULT 'Multi-Platform',
  tournament_id UUID, -- Reference to actual tournament when created
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'created', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournament announcements
ALTER TABLE public.tournament_announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament announcements
CREATE POLICY "Premium users can create announcements" 
ON public.tournament_announcements 
FOR INSERT 
WITH CHECK (
  auth.uid() = creator_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_premium = true
  )
);

CREATE POLICY "Users can view active announcements" 
ON public.tournament_announcements 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Creators can update their announcements" 
ON public.tournament_announcements 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all announcements" 
ON public.tournament_announcements 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Enable RLS on sponsored tournaments
ALTER TABLE public.sponsored_tournaments ENABLE ROW LEVEL SECURITY;

-- RLS policies for sponsored tournaments
CREATE POLICY "Everyone can view sponsored tournaments" 
ON public.sponsored_tournaments 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage sponsored tournaments" 
ON public.sponsored_tournaments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_tournament_announcements_updated_at
  BEFORE UPDATE ON public.tournament_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsored_tournaments_updated_at
  BEFORE UPDATE ON public.sponsored_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial Sunday Showdown template
INSERT INTO public.sponsored_tournaments (
  sponsor_name,
  tournament_type,
  title,
  description,
  entry_fee,
  prize_pool,
  max_participants,
  scheduled_date,
  platform
) VALUES (
  'PUOSU',
  'sunday_showdown',
  'Sunday Showdown Championship',
  'Weekly $100 winner-take-all tournament sponsored by PUOSU. Show your skills and claim the prize!',
  25.00,
  100.00,
  16,
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' + INTERVAL '18 hours', -- Next Sunday 6 PM
  'Multi-Platform'
);

-- Insert daily bronze tournament template for the next 7 days
INSERT INTO public.sponsored_tournaments (
  sponsor_name,
  tournament_type,
  title,
  description,
  entry_fee,
  prize_pool,
  max_participants,
  scheduled_date,
  platform
)
SELECT 
  'PUOSU',
  'daily_bronze',
  'Daily Bronze Showdown - ' || TO_CHAR(CURRENT_DATE + (generate_series(1, 7) || ' days')::INTERVAL, 'Day'),
  'Daily bronze tier tournament sponsored by PUOSU. Perfect for warming up and earning some quick rewards!',
  5.00,
  25.00,
  8,
  CURRENT_DATE + (generate_series(1, 7) || ' days')::INTERVAL + INTERVAL '20 hours', -- 8 PM each day
  'Multi-Platform'
FROM generate_series(1, 7);