-- Enhanced profiles table for PUOSU Gaming platform
-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tilled_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT; -- Keep both payment providers

-- Ensure wallet_balance has proper constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0);

-- Enhanced transactions table for comprehensive wallet tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'entry_fee', 'prize', 'refund', 'commission')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  description TEXT,
  payment_intent_id TEXT, -- For Stripe/Tilled payment tracking
  tournament_id UUID, -- Optional link to tournament
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all transactions
CREATE POLICY "Service can manage transactions" ON public.transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Tournament system tables
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  entry_fee NUMERIC NOT NULL CHECK (entry_fee >= 0),
  max_participants INTEGER NOT NULL DEFAULT 32,
  current_participants INTEGER DEFAULT 0,
  prize_pool NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled')) DEFAULT 'upcoming',
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  tournament_start TIMESTAMPTZ,
  game_mode TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Xbox',
  winner_id UUID REFERENCES public.profiles(user_id),
  automation_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Everyone can view tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

-- Authenticated users can create tournaments
CREATE POLICY "Users can create tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Tournament participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  placement INTEGER, -- Final placement in tournament
  prize_amount NUMERIC DEFAULT 0,
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on tournament participants
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants of tournaments they're in
CREATE POLICY "Users can view tournament participants" ON public.tournament_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    tournament_id IN (SELECT tournament_id FROM public.tournament_participants WHERE user_id = auth.uid())
  );

-- Users can join tournaments
CREATE POLICY "Users can join tournaments" ON public.tournament_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Core wallet management function
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  user_uuid uuid,
  amount_change numeric,
  txn_type text,
  txn_description text DEFAULT NULL,
  tournament_ref uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
  txn_id uuid;
BEGIN
  -- Get current balance with row lock to prevent race conditions
  SELECT wallet_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = user_uuid
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_uuid;
  END IF;

  -- Calculate new balance
  new_balance := current_balance + amount_change;

  -- Prevent negative balances for withdrawals
  IF new_balance < 0 AND txn_type IN ('withdrawal', 'entry_fee') THEN
    RAISE EXCEPTION 'Insufficient funds. Current balance: %, Requested: %', current_balance, ABS(amount_change);
  END IF;

  -- Update wallet balance
  UPDATE public.profiles
  SET wallet_balance = new_balance,
      updated_at = NOW()
  WHERE user_id = user_uuid;

  -- Create transaction record
  INSERT INTO public.transactions (
    user_id, type, amount, status, description, tournament_id
  ) VALUES (
    user_uuid, txn_type, amount_change, 'completed', 
    COALESCE(txn_description, txn_type || ' transaction'), tournament_ref
  ) RETURNING id INTO txn_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', txn_id,
    'previous_balance', current_balance,
    'new_balance', new_balance,
    'amount_changed', amount_change
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Tournament automation functions
CREATE OR REPLACE FUNCTION public.start_tournament_registration(tournament_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tournament_record public.tournaments%ROWTYPE;
BEGIN
  -- Get tournament details
  SELECT * INTO tournament_record
  FROM public.tournaments
  WHERE id = tournament_uuid AND status = 'upcoming';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found or not in upcoming status');
  END IF;

  -- Update status to registration_open
  UPDATE public.tournaments
  SET status = 'registration_open',
      updated_at = NOW()
  WHERE id = tournament_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_uuid,
    'status', 'registration_open'
  );
END;
$$;

-- Function to process tournament entry
CREATE OR REPLACE FUNCTION public.join_tournament(
  tournament_uuid uuid,
  user_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tournament_record public.tournaments%ROWTYPE;
  wallet_result jsonb;
BEGIN
  -- Get tournament details with lock
  SELECT * INTO tournament_record
  FROM public.tournaments
  WHERE id = tournament_uuid AND status = 'registration_open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not available for registration');
  END IF;

  -- Check if tournament is full
  IF tournament_record.current_participants >= tournament_record.max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament is full');
  END IF;

  -- Check if user already joined
  IF EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id = tournament_uuid AND user_id = user_uuid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already registered for this tournament');
  END IF;

  -- Deduct entry fee from wallet
  SELECT public.update_wallet_balance(
    user_uuid,
    -tournament_record.entry_fee,
    'entry_fee',
    'Tournament entry fee for ' || tournament_record.name,
    tournament_uuid
  ) INTO wallet_result;

  IF NOT (wallet_result->>'success')::boolean THEN
    RETURN wallet_result; -- Return the wallet error
  END IF;

  -- Add user to tournament
  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (tournament_uuid, user_uuid);

  -- Update tournament participant count and prize pool
  UPDATE public.tournaments
  SET current_participants = current_participants + 1,
      prize_pool = prize_pool + tournament_record.entry_fee,
      updated_at = NOW()
  WHERE id = tournament_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_uuid,
    'entry_fee_deducted', tournament_record.entry_fee,
    'new_balance', (wallet_result->>'new_balance')::numeric
  );
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_times ON public.tournaments(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();