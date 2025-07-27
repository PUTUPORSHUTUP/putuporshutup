-- Fix foreign key reference for suspicious_activities table
ALTER TABLE suspicious_activities 
DROP CONSTRAINT IF EXISTS suspicious_activities_user_id_fkey;

ALTER TABLE suspicious_activities 
ADD CONSTRAINT suspicious_activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Also fix proof_submissions table to reference profiles instead of auth.users
ALTER TABLE proof_submissions 
DROP CONSTRAINT IF EXISTS proof_submissions_submitted_by_fkey;

ALTER TABLE proof_submissions 
ADD CONSTRAINT proof_submissions_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update the detect_suspicious_stats function to use profiles user_id properly
CREATE OR REPLACE FUNCTION detect_suspicious_stats(
  user_id_param uuid,
  stats_data jsonb,
  game_mode text DEFAULT null
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  kills integer;
  deaths integer;
  kd_ratio numeric;
  headshot_percentage numeric;
  damage_per_kill numeric;
  is_suspicious boolean := false;
  profile_exists boolean := false;
BEGIN
  -- Check if profile exists first
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = user_id_param) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false; -- Don't flag if profile doesn't exist
  END IF;
  
  -- Extract common stats
  kills := COALESCE((stats_data->>'kills')::integer, 0);
  deaths := COALESCE((stats_data->>'deaths')::integer, 1); -- Avoid division by zero
  
  -- Calculate ratios
  kd_ratio := kills::numeric / deaths::numeric;
  
  -- Check for impossible headshot percentage
  IF stats_data ? 'headshot_percentage' THEN
    headshot_percentage := (stats_data->>'headshot_percentage')::numeric;
    IF headshot_percentage > 90 AND kills > 10 THEN
      is_suspicious := true;
    END IF;
  END IF;
  
  -- Check for impossible K/D ratios
  IF kd_ratio > 20 AND kills > 15 THEN
    is_suspicious := true;
  END IF;
  
  -- Check for impossible damage per kill ratios
  IF stats_data ? 'damage_dealt' AND kills > 0 THEN
    damage_per_kill := (stats_data->>'damage_dealt')::numeric / kills;
    IF damage_per_kill > 1000 THEN -- Assuming max damage per kill threshold
      is_suspicious := true;
    END IF;
  END IF;
  
  -- If suspicious, log it
  IF is_suspicious THEN
    INSERT INTO suspicious_activities (
      user_id, 
      activity_type, 
      description, 
      severity
    ) VALUES (
      user_id_param,
      'impossible_stats',
      format('Suspicious stats detected: K/D: %s, HS%%: %s', kd_ratio, headshot_percentage),
      'high'
    );
  END IF;
  
  RETURN is_suspicious;
END;
$$;