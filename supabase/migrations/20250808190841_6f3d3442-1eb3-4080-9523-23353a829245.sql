-- EMERGENCY: Reset existing test user balances only
UPDATE profiles 
SET wallet_balance = 50.00, 
    updated_at = now()
WHERE is_test_account = true;