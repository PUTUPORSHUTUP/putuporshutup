-- Soft Launch Infrastructure
-- Create app settings table for launch control
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admin only access to app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default soft launch settings
INSERT INTO public.app_settings (key, value, description) VALUES
('soft_launch', 'false'::jsonb, 'Enable soft launch mode'),
('max_users', '1000'::jsonb, 'Maximum concurrent users during soft launch'),
('invite_only', 'false'::jsonb, 'Restrict access to invited users only'),
('launch_phase', '0'::jsonb, 'Current launch phase (0=pre, 1=5%, 2=20%, 3=50%)'),
('emergency_mode', 'false'::jsonb, 'Emergency shutdown mode')
ON CONFLICT (key) DO NOTHING;

-- Create emergency rollback function
CREATE OR REPLACE FUNCTION public.emergency_rollback(reason text DEFAULT 'manual_trigger')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_matches int := 0;
  affected_users int := 0;
  rollback_id uuid := gen_random_uuid();
BEGIN
  -- 1. Enable emergency mode
  UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'emergency_mode';
  
  -- 2. Cancel all active matches
  WITH cancelled_matches AS (
    UPDATE challenges 
    SET status = 'cancelled', updated_at = now() 
    WHERE status IN ('open', 'in_progress')
    RETURNING id, total_pot
  )
  SELECT COUNT(*) INTO affected_matches FROM cancelled_matches;
  
  -- 3. Process refunds for cancelled matches
  WITH refunds AS (
    INSERT INTO wallet_transactions (profile_id, amount, type, description, reference_id)
    SELECT 
      cp.user_id,
      cp.stake_paid,
      'refund',
      'Emergency rollback refund - ' || reason,
      rollback_id
    FROM challenge_participants cp
    JOIN challenges c ON cp.challenge_id = c.id
    WHERE c.status = 'cancelled' 
    AND c.updated_at > now() - interval '5 minutes'
    RETURNING profile_id
  ),
  balance_updates AS (
    UPDATE profiles 
    SET wallet_balance = wallet_balance + refunds.amount
    FROM (
      SELECT profile_id, SUM(amount) as amount
      FROM wallet_transactions 
      WHERE reference_id = rollback_id
      GROUP BY profile_id
    ) refunds
    WHERE profiles.user_id = refunds.profile_id
    RETURNING user_id
  )
  SELECT COUNT(DISTINCT user_id) INTO affected_users FROM balance_updates;
  
  -- 4. Log the rollback
  INSERT INTO market_events (event_type, details)
  VALUES ('emergency_rollback', jsonb_build_object(
    'rollback_id', rollback_id,
    'reason', reason,
    'affected_matches', affected_matches,
    'affected_users', affected_users,
    'timestamp', now()
  ));
  
  -- 5. Reset to safe defaults
  UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'soft_launch';
  UPDATE app_settings SET value = '50'::jsonb WHERE key = 'max_users';
  UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'invite_only';
  UPDATE app_settings SET value = '0'::jsonb WHERE key = 'launch_phase';
  
  RETURN jsonb_build_object(
    'success', true,
    'rollback_id', rollback_id,
    'cancelled_matches', affected_matches,
    'refunded_users', affected_users,
    'reason', reason,
    'timestamp', now()
  );
END;
$$;

-- Create emergency user deployment function
CREATE OR REPLACE FUNCTION public.deploy_emergency_users(user_count int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  created_users uuid[];
  deployment_id uuid := gen_random_uuid();
BEGIN
  -- Create emergency test users with high balances
  WITH new_users AS (
    INSERT INTO profiles (
      user_id, 
      username, 
      display_name, 
      wallet_balance, 
      is_test_user, 
      is_test_account
    )
    SELECT 
      gen_random_uuid(),
      'emergency_' || substr(gen_random_uuid()::text, 1, 8),
      'Emergency Player ' || generate_series,
      2000.00, -- High balance for immediate use
      true,
      true
    FROM generate_series(1, user_count)
    RETURNING user_id
  )
  SELECT array_agg(user_id) INTO created_users FROM new_users;
  
  -- Add them to market queue immediately
  INSERT INTO market_queue (user_id, game_key, stake_cents, status)
  SELECT 
    user_id,
    'COD6:KILL_RACE',
    500, -- $5 stake
    'waiting'
  FROM unnest(created_users) AS user_id;
  
  -- Log the deployment
  INSERT INTO market_events (event_type, details)
  VALUES ('emergency_user_deployment', jsonb_build_object(
    'deployment_id', deployment_id,
    'user_count', user_count,
    'created_users', created_users,
    'timestamp', now()
  ));
  
  RETURN jsonb_build_object(
    'success', true,
    'deployment_id', deployment_id,
    'created_users', array_length(created_users, 1),
    'user_ids', created_users
  );
END;
$$;

-- Create manual payout function for emergency use
CREATE OR REPLACE FUNCTION public.manual_payout(match_id uuid, admin_override boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payout_result jsonb;
  is_admin boolean := false;
BEGIN
  -- Check admin permissions unless override
  IF NOT admin_override THEN
    SELECT EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
      RAISE EXCEPTION 'Admin access required for manual payouts';
    END IF;
  END IF;
  
  -- Use existing payout function if available, otherwise implement basic logic
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'market_payout_safe') THEN
    SELECT jsonb_build_object(
      'paid_count', market_payout_safe(match_id, (
        SELECT total_pot * 100 FROM challenges WHERE id = match_id
      ))
    ) INTO payout_result;
  ELSE
    -- Basic payout logic fallback
    WITH winner_payout AS (
      UPDATE profiles 
      SET wallet_balance = wallet_balance + (
        SELECT total_pot * 0.9 FROM challenges WHERE id = match_id
      )
      WHERE user_id = (
        SELECT winner_id FROM challenges WHERE id = match_id
      )
      AND EXISTS (SELECT 1 FROM challenges WHERE id = match_id AND winner_id IS NOT NULL)
      RETURNING user_id
    )
    SELECT jsonb_build_object(
      'paid_count', COUNT(*),
      'manual_override', admin_override
    ) INTO payout_result FROM winner_payout;
  END IF;
  
  -- Log manual payout
  INSERT INTO market_events (event_type, details)
  VALUES ('manual_payout', jsonb_build_object(
    'match_id', match_id,
    'admin_user', auth.uid(),
    'admin_override', admin_override,
    'result', payout_result,
    'timestamp', now()
  ));
  
  RETURN payout_result;
END;
$$;

-- Create soft launch monitoring view
CREATE OR REPLACE VIEW public.soft_launch_metrics AS
SELECT 
  (SELECT value::text::boolean FROM app_settings WHERE key = 'soft_launch') as soft_launch_enabled,
  (SELECT value::text::int FROM app_settings WHERE key = 'max_users') as max_users,
  (SELECT value::text::int FROM app_settings WHERE key = 'launch_phase') as current_phase,
  (SELECT COUNT(*) FROM profiles WHERE last_used > now() - interval '1 hour') as active_users,
  (SELECT COUNT(*) FROM challenges WHERE status = 'open') as open_challenges,
  (SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) 
   FROM market_events 
   WHERE created_at > now() - interval '1 hour' 
   AND error_message IS NULL) as avg_cycle_duration,
  (SELECT COUNT(*) * 100.0 / NULLIF(
    COUNT(*) + (SELECT COUNT(*) FROM market_events 
                WHERE created_at > now() - interval '1 hour' 
                AND error_message IS NOT NULL), 0)
   FROM market_events 
   WHERE created_at > now() - interval '1 hour' 
   AND error_message IS NULL) as success_rate_percent;