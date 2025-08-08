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
    const { manual = false } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 ATOMIC MARKET ENGINE - Starting complete atomic cycle...');
    const startTime = Date.now();

    // Step 1: Get available test users atomically
    const { data: testUsers, error: usersError } = await supabase.rpc('get_available_test_users', {
      min_balance: 5,
      max_users: 8
    });

    if (usersError || !testUsers || testUsers.length < 2) {
      throw new Error(`Insufficient test users: ${testUsers?.length || 0} available`);
    }

    console.log(`Found ${testUsers.length} available test users`);

    // Step 2: Select random game
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, title, description')
      .eq('is_active', true);

    if (gamesError || !games || games.length === 0) {
      throw new Error('No active games found');
    }

    const selectedGame = games[Math.floor(Math.random() * games.length)];
    console.log(`Selected game: ${selectedGame.title}`);

    // Step 3: Create challenge atomically
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        title: `Atomic Market Test - ${selectedGame.title}`,
        description: 'Automated atomic market cycle challenge',
        game_id: selectedGame.id,
        game_title: selectedGame.title,
        challenge_type: testUsers.length === 2 ? '1v1' : 'multiplayer',
        stake_amount: 5.00,
        max_participants: testUsers.length,
        status: 'open',
        is_public: false,
        rules: 'Automated test challenge'
      })
      .select()
      .single();

    if (challengeError || !challenge) {
      throw new Error(`Challenge creation failed: ${challengeError?.message}`);
    }

    const challengeId = challenge.id;
    console.log(`✅ Challenge created: ${challengeId}`);

    // Step 4: Add participants atomically using secure function
    let totalPot = 0;
    for (const user of testUsers) {
      try {
        const { data: joinResult, error: joinError } = await supabase.rpc('secure_join_challenge_atomic', {
          p_challenge_id: challengeId,
          p_user_id: user.user_id,
          p_stake_amount: 5.00
        });

        if (joinError) {
          console.error(`Failed to join user ${user.user_id}:`, joinError);
          continue;
        }

        totalPot += 5.00;
        console.log(`User ${user.user_id} joined successfully`);
      } catch (error) {
        console.error(`Error joining user ${user.user_id}:`, error);
      }
    }

    if (totalPot === 0) {
      throw new Error('No users successfully joined the challenge');
    }

    // Step 5: Activate challenge
    await supabase
      .from('challenges')
      .update({
        status: 'active',
        total_pot: totalPot,
        start_time: new Date().toISOString()
      })
      .eq('id', challengeId);

    console.log(`Challenge activated with ${totalPot} total pot`);

    // Step 6: Simulate match duration
    const matchDuration = manual ? 1000 : 2000 + Math.random() * 1000;
    console.log(`⏱️ Simulating match duration: ${Math.round(matchDuration/1000)}s`);
    await new Promise(resolve => setTimeout(resolve, matchDuration));

    // Step 7: Generate results atomically
    const { data: participants, error: partsError } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('challenge_id', challengeId);

    if (partsError || !participants || participants.length === 0) {
      throw new Error('No participants found for result generation');
    }

    // Generate random stats for each participant
    const statsData = participants.map((p, index) => ({
      challenge_id: challengeId,
      user_id: p.user_id,
      score: Math.floor(Math.random() * 5000) + 1000,
      kills: Math.floor(Math.random() * 30) + 5,
      deaths: Math.floor(Math.random() * 20) + 5,
      assists: Math.floor(Math.random() * 15),
      damage: Math.floor(Math.random() * 10000) + 2000,
      placement: 0 // Will be set after sorting
    }));

    // Sort by score and assign placements
    statsData.sort((a, b) => b.score - a.score);
    statsData.forEach((stat, index) => {
      stat.placement = index + 1;
    });

    // Insert stats
    const { error: statsError } = await supabase
      .from('challenge_stats')
      .insert(statsData);

    if (statsError) {
      throw new Error(`Stats generation failed: ${statsError.message}`);
    }

    const winner = statsData[0];
    console.log(`✅ Results generated, winner: ${winner.user_id} with score ${winner.score}`);

    // Step 8: Process payouts atomically using secure settlement
    const { data: canSettle, error: settleError } = await supabase.rpc('secure_settle_challenge', {
      p_challenge_id: challengeId
    });

    if (settleError || !canSettle) {
      throw new Error(`Settlement failed: ${settleError?.message || 'Already settled'}`);
    }

    // Calculate payouts
    const feeRate = 0.10;
    const netPot = totalPot * (1 - feeRate);
    const platformFee = totalPot * feeRate;

    type Payout = { user_id: string; amount: number };
    const payouts: Payout[] = [];

    if (challenge.challenge_type === '1v1') {
      payouts.push({
        user_id: winner.user_id,
        amount: Number(netPot.toFixed(2))
      });
    } else {
      // Top 3 split for multiplayer
      const amounts = [
        Number((netPot * 0.6).toFixed(2)),
        Number((netPot * 0.3).toFixed(2)),
        Number((netPot * 0.1).toFixed(2))
      ];
      
      for (let i = 0; i < Math.min(3, statsData.length); i++) {
        payouts.push({
          user_id: statsData[i].user_id,
          amount: amounts[i] || 0
        });
      }
    }

    // Process payouts using secure increment function
    let totalPaid = 0;
    for (const payout of payouts) {
      const { data: payoutResult, error: payoutError } = await supabase.rpc('secure_increment_wallet_balance', {
        p_user_id: payout.user_id,
        p_amount: payout.amount,
        p_reason: 'challenge_payout',
        p_challenge_id: challengeId,
        p_requires_admin: false
      });

      if (payoutError) {
        console.error(`Payout failed for ${payout.user_id}:`, payoutError);
        throw new Error(`Payout failed: ${payoutError.message}`);
      }

      totalPaid += payout.amount;
      console.log(`Paid ${payout.user_id}: $${payout.amount}`);
    }

    // Step 9: Mark challenge as completed
    await supabase
      .from('challenges')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        winner_id: winner.user_id
      })
      .eq('id', challengeId);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 ATOMIC MARKET COMPLETE in ${totalTime}ms`);

    // Log successful completion
    await supabase
      .from('payout_automation_log')
      .insert({
        challenge_id: challengeId,
        event_type: 'atomic_market_complete',
        details: {
          total_time_ms: totalTime,
          participants: participants.length,
          winner_score: winner.score,
          total_payout: totalPaid,
          platform_fee: platformFee
        },
        success: true
      });

    return new Response(JSON.stringify({
      success: true,
      challengeId,
      totalTimeMs: totalTime,
      challenge: {
        participantCount: participants.length,
        totalPot,
        gameTitle: selectedGame.title
      },
      winner: {
        user_id: winner.user_id,
        score: winner.score
      },
      payouts: {
        processed: payouts.length,
        totalPaid,
        platformFee
      },
      message: `Complete atomic market cycle in ${Math.round(totalTime/1000)}s!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Atomic Market Engine failed:', error.message);
    
    // Log the failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('payout_automation_log')
        .insert({
          event_type: 'atomic_market_failed',
          details: { error: error.message },
          success: false
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});