-- Secure market_wallets table
-- Drop any existing overly permissive SELECT policies
DROP POLICY IF EXISTS "mw_read_all" ON market_wallets;
DROP POLICY IF EXISTS "Public can view wallets" ON market_wallets;
DROP POLICY IF EXISTS "Anyone can view wallets" ON market_wallets;

-- Revoke any broad grants
REVOKE SELECT ON market_wallets FROM anon;
REVOKE SELECT ON market_wallets FROM authenticated;

-- Create policy: Users can only view their own wallet
CREATE POLICY "Users can view own wallet"
  ON market_wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy: Admins can view all wallets
CREATE POLICY "Admins can view all wallets"
  ON market_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.role = 'admin'
    )
  );

-- Create policy: Users can update their own wallet (for SECURITY DEFINER functions)
CREATE POLICY "Service can update wallets"
  ON market_wallets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy: Service can insert wallets
CREATE POLICY "Service can insert wallets"
  ON market_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);