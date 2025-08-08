import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 INSTANT CHALLENGE CREATOR - Creating challenge instantly...');

    // Get available test users with sufficient balance
    const { data: testUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, username, wallet_balance')
      .gte('wallet_balance', 10.0)
      .limit(6);
    
    if (usersError || !testUsers?.length) {
      throw new Error(`No test users available: ${usersError?.message}`);
    }

    // Get a random game
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (gamesError || !games?.length) {
      throw new Error(`No games available: ${gamesError?.message}`);
    }

    const game = games[0];
    const stakeAmount = 10;
    const challengeTitle = `Instant Challenge - ${game.name}`;

    // Create challenge instantly
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        title: challengeTitle,
        description: 'Auto-generated instant challenge',
        game_id: game.id,
        platform: 'xbox',
        stake_amount: stakeAmount,
        max_participants: 4,
        creator_id: testUsers[0].user_id,
        challenge_type: 'top3',
        status: 'open'
      })
      .select()
      .single();

    if (challengeError) {
      throw new Error(`Failed to create challenge: ${challengeError.message}`);
    }

    console.log('✅ Challenge created:', challenge.id);

    // Add participants instantly using direct database operations
    let participantCount = 0;
    for (const user of testUsers.slice(0, 4)) {
      try {
        // Insert participant
        const { error: participantError } = await supabase
          .from('challenge_participants')
          .insert({
            challenge_id: challenge.id,
            user_id: user.user_id,
            stake_paid: stakeAmount
          });
        
        if (!participantError) {
          // Deduct stake from wallet
          const { error: walletError } = await supabase
            .from('profiles')
            .update({ 
              wallet_balance: user.wallet_balance - stakeAmount 
            })
            .eq('user_id', user.user_id);
          
          if (!walletError) {
            participantCount++;
            console.log(`✅ User ${participantCount} joined challenge`);
          } else {
            console.log(`⚠️ Failed to deduct stake: ${walletError.message}`);
          }
        } else {
          console.log(`⚠️ Failed to join challenge: ${participantError.message}`);
        }
      } catch (error) {
        console.log(`⚠️ User failed to join: ${error.message}`);
        break;
      }
    }

    if (participantCount < 2) {
      throw new Error('Insufficient participants joined');
    }

    // Calculate total pot
    const totalPot = participantCount * stakeAmount;
    
    // Update challenge status to active
    await supabase
      .from('challenges')
      .update({ 
        status: 'active',
        total_pot: totalPot,
        start_time: new Date().toISOString()
      })
      .eq('id', challenge.id);

    console.log(`🎯 INSTANT CHALLENGE CREATED: ${challenge.id} with ${participantCount} players, pot: $${totalPot}`);

    return new Response(JSON.stringify({
      success: true,
      challengeId: challenge.id,
      participantCount,
      totalPot,
      gameTitle: game.name,
      message: 'Challenge created and players joined instantly!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Instant challenge creation failed:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});