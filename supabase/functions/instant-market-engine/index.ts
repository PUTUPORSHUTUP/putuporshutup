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

    console.log('🚀 INSTANT MARKET ENGINE - Starting complete market cycle...');
    const startTime = Date.now();

    // Step 1: Create challenge instantly
    console.log('Step 1: Creating challenge...');
    const challengeResponse = await supabase.functions.invoke('instant-challenge-creator', {});
    
    if (challengeResponse.error) {
      throw new Error(`Challenge creation failed: ${challengeResponse.error.message}`);
    }

    const challengeData = challengeResponse.data;
    const challengeId = challengeData.challengeId;
    
    console.log(`✅ Challenge created: ${challengeId} with ${challengeData.participantCount} players`);

    // Step 2: Simulate match duration (1-3 seconds for instant demo)
    const matchDuration = manual ? 1000 : 2000 + Math.random() * 1000; // 2-3 seconds
    console.log(`⏱️ Simulating match duration: ${Math.round(matchDuration/1000)}s`);
    await new Promise(resolve => setTimeout(resolve, matchDuration));

    // Step 3: Generate results instantly
    console.log('Step 3: Generating results...');
    const resultsResponse = await supabase.functions.invoke('instant-result-generator', {
      body: { challengeId }
    });

    if (resultsResponse.error) {
      throw new Error(`Result generation failed: ${resultsResponse.error.message}`);
    }

    const resultsData = resultsResponse.data;
    console.log(`✅ Results generated, winner: ${resultsData.winner.user_id}`);

    // Step 4: Process payouts instantly
    console.log('Step 4: Processing payouts...');
    const payoutResponse = await supabase.functions.invoke('instant-payout-processor', {
      body: { challengeId }
    });

    if (payoutResponse.error) {
      throw new Error(`Payout processing failed: ${payoutResponse.error.message}`);
    }

    const payoutData = payoutResponse.data;
    console.log(`✅ Payouts processed: ${payoutData.payoutsProcessed} payments`);

    const totalTime = Date.now() - startTime;
    console.log(`🎉 INSTANT MARKET COMPLETE in ${totalTime}ms`);

    // Log successful completion
    await supabase
      .from('payout_automation_log')
      .insert({
        challenge_id: challengeId,
        event_type: 'instant_market_complete',
        details: {
          total_time_ms: totalTime,
          participants: challengeData.participantCount,
          winner_score: resultsData.winner.score,
          total_payout: payoutData.netPot,
          platform_fee: payoutData.platformFee
        },
        success: true
      });

    return new Response(JSON.stringify({
      success: true,
      challengeId,
      totalTimeMs: totalTime,
      challenge: {
        participantCount: challengeData.participantCount,
        totalPot: challengeData.totalPot,
        gameTitle: challengeData.gameTitle
      },
      winner: resultsData.winner,
      payouts: {
        processed: payoutData.payoutsProcessed,
        totalPaid: payoutData.netPot,
        platformFee: payoutData.platformFee
      },
      message: `Complete instant market cycle in ${Math.round(totalTime/1000)}s!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Instant Market Engine failed:', error.message);
    
    // Log the failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('payout_automation_log')
        .insert({
          event_type: 'instant_market_failed',
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