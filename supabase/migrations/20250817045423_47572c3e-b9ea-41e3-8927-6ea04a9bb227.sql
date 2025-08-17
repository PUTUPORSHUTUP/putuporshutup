-- Create automated match using an existing user ID
-- Get first available user for automated matches
DO $$
DECLARE
    system_user_id uuid;
BEGIN
    -- Get the first available user
    SELECT user_id INTO system_user_id 
    FROM public.profiles 
    WHERE user_id NOT IN (
        SELECT user_id FROM public.match_queue WHERE queue_status = 'searching'
    )
    LIMIT 1;
    
    -- Create the automated match
    INSERT INTO public.match_queue (
        user_id,
        stake_amount,
        game_id,
        platform,
        queue_status,
        queued_at,
        expires_at,
        entry_fee,
        payout_type,
        vip_required,
        automated,
        game_mode_key
    ) VALUES (
        system_user_id,
        1.00,
        'a39ff069-f19e-4d56-b522-81601ad60cee',
        'Xbox',
        'searching',
        now(),
        now() + interval '30 minutes',
        1.00,
        'winner_take_all',
        false,
        true,
        'competitive'
    );
    
    -- Update rotation state
    UPDATE public.match_cycle_state 
    SET idx = 1, last_created = now() 
    WHERE id = 1;
END $$;