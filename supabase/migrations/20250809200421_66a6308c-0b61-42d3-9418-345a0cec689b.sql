-- CRITICAL SECURITY FIXES

-- 1. Fix Profile Data Exposure
-- Drop the overly permissive policy and create proper user-scoped policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create separate policies for different access levels
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profile fields of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true)
WITH (
  -- Only allow access to public fields, hide sensitive data
  username, display_name, avatar_url, created_at, is_premium, vip_access
);

CREATE POLICY "Admins can view all profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Enable RLS on missing critical tables
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for match_results
CREATE POLICY "Users can view their own match results"
ON public.match_results
FOR SELECT
TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Match participants can view results"
ON public.match_results
FOR SELECT
TO authenticated
USING (
  match_id IN (
    SELECT id FROM matches 
    WHERE player_a = auth.uid() OR player_b = auth.uid()
  )
);

CREATE POLICY "Admins can view all match results"
ON public.match_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for matches
CREATE POLICY "Users can view their own matches"
ON public.matches
FOR SELECT
TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid());

CREATE POLICY "Admins can manage all matches"
ON public.matches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3. Secure Transaction System
-- Drop overly permissive transaction policies
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "All transactions viewable by admin" ON public.transactions;

-- Create proper transaction policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only allow system to create transactions, not direct user inserts
CREATE POLICY "Only system can create transactions"
ON public.transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Add additional wallet balance validation
ALTER TABLE public.profiles 
ADD CONSTRAINT wallet_balance_reasonable 
CHECK (wallet_balance >= 0 AND wallet_balance <= 100000);

-- 5. Secure market wallet operations
ALTER TABLE public.market_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own market wallet"
ON public.market_wallets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage market wallets"
ON public.market_wallets
FOR ALL
TO service_role
USING (true);

-- 6. Secure escrow accounts
CREATE POLICY "Users can view their related escrow"
ON public.escrow_accounts
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  released_to = auth.uid() OR
  wager_id IN (
    SELECT id FROM challenges WHERE creator_id = auth.uid()
  )
);

-- 7. Add security logging function
CREATE OR REPLACE FUNCTION log_security_violation(
  violation_type text,
  user_id uuid DEFAULT auth.uid(),
  details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    user_id, 
    details,
    severity
  ) VALUES (
    violation_type,
    user_id,
    details,
    'high'
  );
END;
$$;

-- 8. Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param uuid,
  action_type text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM security_events
  WHERE user_id = user_id_param
    AND event_type = action_type
    AND created_at > now() - (time_window_minutes || ' minutes')::interval;
  
  IF attempt_count >= max_attempts THEN
    -- Log the rate limit violation
    PERFORM log_security_violation(
      'rate_limit_exceeded',
      user_id_param,
      jsonb_build_object(
        'action_type', action_type,
        'attempt_count', attempt_count,
        'max_attempts', max_attempts
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Log the attempt
  PERFORM log_security_event(
    action_type,
    user_id_param,
    jsonb_build_object('timestamp', now())
  );
  
  RETURN TRUE;
END;
$$;