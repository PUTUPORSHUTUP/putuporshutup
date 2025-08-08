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
    const body = await req.json().catch(() => ({}));
    const { 
      manual = false, 
      min_players = 6, 
      crash_rate = 0.05, 
      force_no_crash = true 
    } = body;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 DATABASE MARKET ENGINE - Starting atomic cycle...');
    const startTime = Date.now();

    // Use the working v2 atomic function instead
    const { data, error } = await supabase.rpc('atomic_market_cycle_v2');

    if (error) {
      console.error('❌ Atomic market cycle failed:', error);
      console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
      
      // Log error to database
      try {
        await supabase.from('market_engine_errors').insert({
          error: error.message || 'Unknown database error',
          stack: JSON.stringify({ code: error.code, details: error.details, hint: error.hint }),
          environment: {
            min_players,
            crash_rate,
            force_no_crash,
            manual
          }
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Database function failed',
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: 'Database market engine failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 DATABASE MARKET COMPLETE in ${totalTime}ms`);

    const result = data as {
      success: boolean;
      challenge_id: string;
      crashed: boolean;
      refund_count?: number;
      participants: number;
      total_pot?: number;
      winner?: { user_id: string; score: number };
      message: string;
    };

    // Transform response to match existing interface
    const response = {
      success: result.success,
      challengeId: result.challenge_id,
      totalTimeMs: totalTime,
      challenge: {
        participantCount: result.participants,
        totalPot: result.total_pot || 0,
        gameTitle: 'Atomic Market Challenge'
      },
      winner: result.winner ? {
        user_id: result.winner.user_id,
        score: result.winner.score
      } : null,
      payouts: result.crashed ? {
        processed: 0,
        totalPaid: 0,
        platformFee: 0,
        refunded: result.refund_count || 0
      } : {
        processed: result.participants <= 2 ? 1 : 3,
        totalPaid: (result.total_pot || 0) * 0.9, // After 10% platform fee
        platformFee: (result.total_pot || 0) * 0.1
      },
      crashed: result.crashed,
      message: result.message
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Database Market Engine failed:', error.message);
    
    // Try to log the failure
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('market_engine_errors').insert({
        error: error.message,
        stack: error.stack || '',
        environment: {
          timestamp: new Date().toISOString(),
          function: 'database-market-engine'
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

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