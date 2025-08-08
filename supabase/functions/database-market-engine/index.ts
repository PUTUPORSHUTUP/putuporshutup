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
    const { manual = false } = await req.json().catch(() => ({}));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 DATABASE MARKET ENGINE - Starting atomic cycle...');
    const startTime = Date.now();

    // Call the working v2 atomic function
    const { data, error } = await supabase.rpc('atomic_market_cycle_v2');

    if (error) {
      console.error('❌ Atomic market cycle failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Database function failed',
        message: 'Database market engine failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 DATABASE MARKET COMPLETE in ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      challengeId: data.challenge_id,
      totalTimeMs: totalTime,
      challenge: {
        participantCount: data.players,
        totalPot: data.players * 100 * 0.9, // Assuming $100 stake per player minus 10% fee
        gameTitle: 'Database Market Challenge'
      },
      winner: data.winner ? {
        user_id: data.winner.user_id,
        score: data.winner.score || 0
      } : null,
      message: `Complete market cycle in ${Math.round(totalTime/1000)}s!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Database Market Engine failed:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Database market engine failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});