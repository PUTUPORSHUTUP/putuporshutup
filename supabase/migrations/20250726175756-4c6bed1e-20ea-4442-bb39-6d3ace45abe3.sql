-- Add admin policies for game suggestions management
-- Allow admins to update any game suggestion (for approval/rejection)
CREATE POLICY "Admins can update any game suggestion" 
ON game_suggestions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete game suggestions if needed
CREATE POLICY "Admins can delete game suggestions" 
ON game_suggestions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);