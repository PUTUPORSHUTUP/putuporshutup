-- Create the join_tournament function
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
  user_balance numeric;
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

  -- Get user balance
  SELECT wallet_balance INTO user_balance
  FROM public.profiles
  WHERE user_id = user_uuid;

  IF user_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF user_balance < tournament_record.entry_fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- Deduct entry fee from wallet
  UPDATE public.profiles
  SET wallet_balance = wallet_balance - tournament_record.entry_fee,
      updated_at = NOW()
  WHERE user_id = user_uuid;

  -- Add user to tournament
  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (tournament_uuid, user_uuid);

  -- Update tournament participant count and prize pool
  UPDATE public.tournaments
  SET current_participants = current_participants + 1,
      prize_pool = prize_pool + tournament_record.entry_fee,
      updated_at = NOW()
  WHERE id = tournament_uuid;

  -- Create transaction record
  INSERT INTO public.transactions (
    user_id, type, amount, status, description, tournament_id
  ) VALUES (
    user_uuid, 'entry_fee', -tournament_record.entry_fee, 'completed', 
    'Tournament entry fee for ' || tournament_record.name, tournament_uuid
  );

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', tournament_uuid,
    'entry_fee_deducted', tournament_record.entry_fee,
    'new_balance', user_balance - tournament_record.entry_fee
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;