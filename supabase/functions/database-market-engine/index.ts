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
    const { auto_seed = true, mode_key = 'COD6:KILL_RACE' } = await req.json().catch(() => ({}));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🎮 DATABASE MARKET ENGINE - Starting for mode: ${mode_key}, auto_seed: ${auto_seed}`);
    const startTime = Date.now();

    // Call the updated db_market_run function with game mode support
    const { data, error } = await supabase.rpc('db_market_run', {
      p_auto_seed: auto_seed,
      p_mode_key: mode_key
    });

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
    console.log(`🎉 DATABASE MARKET COMPLETE for ${mode_key} in ${totalTime}ms - Status: ${data.status}`);

    // Handle different response statuses
    if (data.status === 'invalid_mode') {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid or disabled game mode: ${mode_key}`,
        message: data.message || 'Game mode not available'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: data.status === 'success',
      status: data.status,
      mode_key: data.mode_key || mode_key,
      challengeId: data.challenge_id,
      totalTimeMs: totalTime,
      challenge: {
        participantCount: data.players_paired || 0,
        totalPot: data.pot_cents ? data.pot_cents / 100 : 0,
        gameTitle: `${mode_key} Challenge`,
        seeded: data.seeded || false
      },
      paidRows: data.paid_rows || 0,
      message: data.status === 'success' 
        ? `Complete ${mode_key} match in ${Math.round(totalTime/1000)}s!`
        : data.message || `${data.status} - ${data.players_paired || 0} players paired`
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