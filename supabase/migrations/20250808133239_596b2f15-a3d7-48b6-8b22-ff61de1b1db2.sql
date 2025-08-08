-- Add service role validation function and additional safeguards (corrected)
BEGIN;

-- Create helper function to verify service role calls
CREATE OR REPLACE FUNCTION is_service_role() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access on payout_automation_log" ON payout_automation_log;
DROP POLICY IF EXISTS "Service role full access on wallet_transactions" ON wallet_transactions;

-- Add service role policy for payout_automation_log
CREATE POLICY "Service role full access on payout_automation_log"
ON payout_automation_log
FOR ALL USING (is_service_role());

-- Add service role policy for wallet_transactions  
CREATE POLICY "Service role full access on wallet_transactions"
ON wallet_transactions
FOR ALL USING (is_service_role());

-- Add index for better payout monitoring performance
CREATE INDEX IF NOT EXISTS idx_payout_automation_log_entity_created 
ON payout_automation_log(entity_id, entity_type, created_at DESC);

-- Add constraint to prevent negative wallet balances
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_wallet_balance_non_negative'
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT chk_wallet_balance_non_negative 
        CHECK (wallet_balance >= 0);
    END IF;
END $$;

COMMIT;