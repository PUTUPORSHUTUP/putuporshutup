-- Fix test profiles wallet balances using proper variable naming
DO $$
DECLARE
    test_user_ids UUID[] := ARRAY[
        'c6a8a18d-ec2d-4446-ab15-73c45bf93343',
        'b51e56dd-7b61-4fe9-bba0-6ffb2b51b8d0', 
        '12da340a-464a-4987-bac9-c69b546312ed',
        '244947fb-30f8-4664-ae27-ec08cecae5c4',
        '6194700d-448b-4f18-8c9e-ab08987de3ca',
        'dc79e64e-364e-467f-871b-45c638f02971'
    ];
    target_user_id UUID;
BEGIN
    FOREACH target_user_id IN ARRAY test_user_ids
    LOOP
        -- Update wallet balance to $50 for each test account
        UPDATE profiles 
        SET wallet_balance = 50.00, 
            updated_at = now()
        WHERE profiles.user_id = target_user_id 
        AND profiles.is_test_account = true;
        
        -- Insert wallet transaction record if it doesn't exist
        INSERT INTO wallet_transactions (
            user_id,
            amount,
            transaction_type,
            reason,
            balance_before,
            balance_after
        ) VALUES (
            target_user_id,
            50.00,
            'credit',
            'test_setup_funding',
            0.00,
            50.00
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;