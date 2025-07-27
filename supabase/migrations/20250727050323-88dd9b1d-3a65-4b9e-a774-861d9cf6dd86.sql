-- Add proof submission and automated flagging to tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS proof_required boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_verification boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_threshold numeric DEFAULT 0.8;

-- Add proof and verification columns to tournament matches
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS proof_urls text[],
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged', 'disputed')),
ADD COLUMN IF NOT EXISTS verification_score numeric,
ADD COLUMN IF NOT EXISTS flagged_reason text,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create table for proof submissions
CREATE TABLE IF NOT EXISTS proof_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_match_id uuid REFERENCES tournament_matches(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES auth.users(id) NOT NULL,
  proof_type text NOT NULL CHECK (proof_type IN ('screenshot', 'video', 'stream_link', 'api_data')),
  proof_url text NOT NULL,
  stats_claimed jsonb,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'flagged')),
  ai_analysis_score numeric,
  ai_analysis_notes text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create suspicious activity tracking
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('impossible_stats', 'duplicate_proof', 'fake_screenshot', 'pattern_abuse')),
  tournament_match_id uuid REFERENCES tournament_matches(id),
  challenge_id uuid REFERENCES challenges(id),
  description text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_detected boolean DEFAULT true,
  investigated_by uuid REFERENCES auth.users(id),
  investigation_notes text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create game API integrations table
CREATE TABLE IF NOT EXISTS game_api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) NOT NULL,
  platform text NOT NULL CHECK (platform IN ('playstation', 'xbox', 'steam', 'epic', 'origin')),
  api_endpoint text NOT NULL,
  api_key_required boolean DEFAULT true,
  stat_mappings jsonb, -- Maps our stat names to API field names
  is_active boolean DEFAULT false,
  rate_limit_per_minute integer DEFAULT 60,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(game_id, platform)
);

-- Enable RLS
ALTER TABLE proof_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_api_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proof_submissions
CREATE POLICY "Users can view their own proof submissions" ON proof_submissions
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Users can create proof submissions" ON proof_submissions
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Moderators can view all proof submissions" ON proof_submissions
  FOR SELECT USING (is_user_moderator());

CREATE POLICY "Moderators can update proof submissions" ON proof_submissions
  FOR UPDATE USING (is_user_moderator());

-- RLS Policies for suspicious_activities  
CREATE POLICY "Moderators can view suspicious activities" ON suspicious_activities
  FOR SELECT USING (is_user_moderator());

CREATE POLICY "System can create suspicious activities" ON suspicious_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Moderators can update suspicious activities" ON suspicious_activities
  FOR UPDATE USING (is_user_moderator());

-- RLS Policies for game_api_integrations
CREATE POLICY "Admins can manage game API integrations" ON game_api_integrations
  FOR ALL USING (is_user_admin());

CREATE POLICY "Public can view active integrations" ON game_api_integrations
  FOR SELECT USING (is_active = true);

-- Create function to detect suspicious stats
CREATE OR REPLACE FUNCTION detect_suspicious_stats(
  user_id_param uuid,
  stats_data jsonb,
  game_mode text DEFAULT null
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  kills integer;
  deaths integer;
  kd_ratio numeric;
  headshot_percentage numeric;
  damage_per_kill numeric;
  is_suspicious boolean := false;
BEGIN
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

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_proof_submissions_updated_at
  BEFORE UPDATE ON proof_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspicious_activities_updated_at
  BEFORE UPDATE ON suspicious_activities  
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_api_integrations_updated_at
  BEFORE UPDATE ON game_api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();