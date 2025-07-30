-- Create an epic Sunday Showdown tournament for 12 noon tomorrow
DO $$
DECLARE
    tournament_id UUID;
    tomorrow_noon TIMESTAMPTZ;
BEGIN
    -- Calculate tomorrow at 12 noon
    tomorrow_noon := (CURRENT_DATE + INTERVAL '1 day' + TIME '12:00:00') AT TIME ZONE 'UTC';
    
    -- Insert the epic tournament
    INSERT INTO tournaments (
        id,
        creator_id,
        game_id,
        title,
        description,
        entry_fee,
        max_participants,
        current_participants,
        prize_pool,
        platform,
        start_time,
        registration_end_time,
        tournament_type,
        status,
        sponsored,
        sponsorship_tier,
        sponsor_cost,
        poster_url,
        created_at
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000', -- System user
        (SELECT id FROM games WHERE name = 'call_of_duty' LIMIT 1),
        '🔥 SUNDAY SHOWDOWN @ NOON 🔥',
        'EPIC 12 NOON SHOWDOWN! The ultimate weekend warrior battle. Winner takes all in this high-stakes elimination tournament. Featuring automated lobbies, instant payouts, and legendary bragging rights. Are you ready to PUT UP OR SHUT UP?',
        25.00,
        16,
        0,
        1000.00, -- Epic $1000 prize pool
        'Xbox',
        tomorrow_noon,
        tomorrow_noon - INTERVAL '1 hour', -- Registration closes 1 hour before
        'single_elimination',
        'open',
        true,
        'platinum',
        800,
        '/src/assets/sunday-showdown-12noon.jpg',
        NOW()
    ) RETURNING id INTO tournament_id;
    
    -- Create announcement entry
    INSERT INTO match_notifications (
        id,
        user_id,
        notification_type,
        title,
        message,
        match_id,
        created_at,
        is_read
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'tournament_announcement',
        '🚨 EPIC SUNDAY SHOWDOWN @ 12 NOON! 🚨',
        'The ultimate weekend warrior battle is live! $1000 prize pool, 16 players, single elimination. Registration open now - match starts tomorrow at 12 noon sharp!',
        tournament_id::text,
        NOW(),
        false
    );
    
    -- Log the automation action
    INSERT INTO automated_actions (
        automation_type,
        action_type,
        success,
        target_id,
        action_data
    ) VALUES (
        'epic_tournament_creation',
        'sunday_showdown_created',
        true,
        tournament_id::text,
        jsonb_build_object(
            'tournament_title', '🔥 SUNDAY SHOWDOWN @ NOON 🔥',
            'start_time', tomorrow_noon,
            'prize_pool', 1000,
            'entry_fee', 25,
            'max_participants', 16,
            'epic_features', jsonb_build_array(
                'Automated Xbox Lobby Creation',
                'Instant Result Verification', 
                'Real-time Bracket Updates',
                'Automated Prize Distribution',
                'Professional Tournament Poster',
                'Live Notifications & Updates'
            )
        )
    );
    
    RAISE NOTICE 'Epic Sunday Showdown tournament created with ID: %', tournament_id;
END $$;