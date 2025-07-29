-- Add RLS policies for automation_config table
CREATE POLICY "Admins can manage automation config" 
ON automation_config 
FOR ALL 
USING (is_user_admin());

-- Add RLS policies for automated_actions table  
CREATE POLICY "Admins can view automated actions"
ON automated_actions
FOR SELECT
USING (is_user_admin());

CREATE POLICY "Service can insert automated actions"
ON automated_actions
FOR INSERT
WITH CHECK (true);