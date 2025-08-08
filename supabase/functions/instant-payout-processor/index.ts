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
    const { challengeId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💰 INSTANT PAYOUT PROCESSOR - Processing challenge:', challengeId);

    // Mark as settled using direct database update (prevents double processing)
    const { data: updateResult, error: settleError } = await supabase
      .from('challenges')
      .update({ status: 'settled' })
      .eq('id', challengeId)
      .neq('status', 'settled')
      .select('id');

    if (settleError) {
      throw new Error(`Failed to settle challenge: ${settleError.message}`);
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('⚠️ Challenge already settled, skipping payout');
      return new Response(JSON.stringify({
        success: true,
        message: 'Challenge already settled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('total_pot, challenge_type')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      throw new Error(`Challenge not found: ${challengeError.message}`);
    }

    // Get participants
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('user_id, stake_paid')
      .eq('challenge_id', challengeId);

    if (participantsError) {
      throw new Error(`Failed to get participants: ${participantsError.message}`);
    }

    // Get participant stats (for ranking)
    const { data: stats, error: statsError } = await supabase
      .from('challenge_stats')
      .select('user_id, score, kills, placement')
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false });

    if (statsError) {
      console.log('⚠️ No stats found, using random ranking');
    }

    const totalPot = challenge.total_pot;
    const platformFee = totalPot * 0.1; // 10% platform fee
    const netPot = totalPot - platformFee;

    console.log(`💵 Total pot: $${totalPot}, Platform fee: $${platformFee}, Net pot: $${netPot}`);

    let payouts = [];
    const participantCount = participants.length;

    // Calculate payouts based on challenge type
    if (challenge.challenge_type === '1v1' && participantCount === 2) {
      // Winner takes all (minus platform fee)
      const winner = stats?.[0] || participants[Math.floor(Math.random() * participants.length)];
      payouts = [{ user_id: winner.user_id, amount: netPot, position: 1 }];
    } else {
      // Top 3 payout system (50/30/20)
      const positions = stats?.length >= participantCount 
        ? stats.slice(0, Math.min(3, participantCount))
        : participants.slice(0, Math.min(3, participantCount)).map((p, i) => ({ user_id: p.user_id, position: i + 1 }));

      if (participantCount >= 3) {
        payouts = [
          { user_id: positions[0].user_id, amount: netPot * 0.5, position: 1 },
          { user_id: positions[1].user_id, amount: netPot * 0.3, position: 2 },
          { user_id: positions[2].user_id, amount: netPot * 0.2, position: 3 }
        ];
      } else if (participantCount === 2) {
        payouts = [
          { user_id: positions[0].user_id, amount: netPot * 0.7, position: 1 },
          { user_id: positions[1].user_id, amount: netPot * 0.3, position: 2 }
        ];
      } else {
        payouts = [{ user_id: positions[0].user_id, amount: netPot, position: 1 }];
      }
    }

    // Process payouts instantly
    const processedPayouts = [];
    for (const payout of payouts) {
      try {
        // Get current balance and update directly
        const { data: profile, error: getError } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', payout.user_id)
          .single();
        
        if (getError || !profile) {
          throw new Error(`Profile not found: ${getError?.message}`);
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            wallet_balance: profile.wallet_balance + payout.amount 
          })
          .eq('user_id', payout.user_id);
        
        if (updateError) {
          throw new Error(`Failed to update balance: ${updateError.message}`);
        }

        processedPayouts.push(payout);
        console.log(`✅ Paid $${payout.amount} to position ${payout.position}`);
      } catch (error) {
        console.error(`❌ Failed to pay user ${payout.user_id}:`, error.message);
      }
    }

    // Mark challenge as completed
    await supabase
      .from('challenges')
      .update({ 
        status: 'completed',
        winner_id: payouts[0]?.user_id 
      })
      .eq('id', challengeId);

    console.log(`🎉 INSTANT PAYOUT COMPLETE: ${processedPayouts.length} payouts processed`);

    return new Response(JSON.stringify({
      success: true,
      challengeId,
      totalPot,
      platformFee,
      netPot,
      payoutsProcessed: processedPayouts.length,
      payouts: processedPayouts,
      message: 'Payouts processed instantly!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Instant payout failed:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});