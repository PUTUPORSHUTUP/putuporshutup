-- Create match preferences table for storing user matching preferences
CREATE TABLE public.match_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  min_stake NUMERIC NOT NULL DEFAULT 10.00,
  max_stake NUMERIC NOT NULL DEFAULT 100.00,
  preferred_games UUID[] NOT NULL DEFAULT '{}',
  preferred_platforms TEXT[] NOT NULL DEFAULT '{}',
  auto_match_enabled BOOLEAN NOT NULL DEFAULT false,
  max_queue_time_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create match queue table for tracking active matching requests
CREATE TABLE public.match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stake_amount NUMERIC NOT NULL,
  game_id UUID NOT NULL REFERENCES public.games(id),
  platform TEXT NOT NULL,
  queue_status TEXT NOT NULL DEFAULT 'searching' CHECK (queue_status IN ('searching', 'matched', 'expired', 'cancelled')),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  matched_with_user_id UUID REFERENCES auth.users(id),
  matched_at TIMESTAMPTZ,
  wager_id UUID REFERENCES public.wagers(id),
  UNIQUE(user_id) -- Only one active queue entry per user
);

-- Create match notifications table for storing match results
CREATE TABLE public.match_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_queue_id UUID NOT NULL REFERENCES public.match_queue(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES auth.users(id),
  wager_id UUID REFERENCES public.wagers(id),
  notification_type TEXT NOT NULL DEFAULT 'match_found' CHECK (notification_type IN ('match_found', 'match_accepted', 'match_expired')),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for match_preferences
CREATE POLICY "Users can view their own match preferences" 
ON public.match_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match preferences" 
ON public.match_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own match preferences" 
ON public.match_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for match_queue
CREATE POLICY "Users can view their own queue entries" 
ON public.match_queue 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = matched_with_user_id);

CREATE POLICY "Users can insert their own queue entries" 
ON public.match_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries" 
ON public.match_queue 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all queue entries" 
ON public.match_queue 
FOR ALL 
USING (true);

-- Create RLS policies for match_notifications
CREATE POLICY "Users can view their own match notifications" 
ON public.match_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all notifications" 
ON public.match_notifications 
FOR ALL 
USING (true);

-- Create function to automatically expire old queue entries
CREATE OR REPLACE FUNCTION expire_old_queue_entries()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.match_queue 
  SET queue_status = 'expired'
  WHERE expires_at < now() 
    AND queue_status = 'searching';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to expire old entries periodically
CREATE OR REPLACE FUNCTION cleanup_expired_queue_entries()
RETURNS void AS $$
BEGIN
  UPDATE public.match_queue 
  SET queue_status = 'expired'
  WHERE expires_at < now() 
    AND queue_status = 'searching';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_match_queue_status ON public.match_queue(queue_status);
CREATE INDEX idx_match_queue_game_platform ON public.match_queue(game_id, platform);
CREATE INDEX idx_match_queue_stake ON public.match_queue(stake_amount);
CREATE INDEX idx_match_queue_expires ON public.match_queue(expires_at);
CREATE INDEX idx_match_notifications_user_read ON public.match_notifications(user_id, read);

-- Add realtime for match_queue and match_notifications
ALTER TABLE public.match_queue REPLICA IDENTITY FULL;
ALTER TABLE public.match_notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_notifications;