-- Enable RLS on simulation_errors table
ALTER TABLE simulation_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for simulation_errors table
CREATE POLICY "Service can manage simulation errors" ON simulation_errors
  FOR ALL USING (true);

CREATE POLICY "Admins can view simulation errors" ON simulation_errors
  FOR SELECT USING (is_user_admin());