import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challengeId, userId, stakeAmount } = await req.json();

    if (!challengeId || !userId || !stakeAmount) {
      return new Response(JSON.stringify({ 
        error: "challengeId, userId, and stakeAmount required" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // Call the atomic join function
    const { error } = await supabase.rpc('join_challenge_atomic', {
      p_challenge_id: challengeId,
      p_user_id: userId,
      p_stake_amount: stakeAmount
    });

    if (error) {
      console.error("Join challenge atomic error:", error);
      return new Response(JSON.stringify({ 
        error: error.message 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true,
      message: "Successfully joined challenge and debited wallet"
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in join-challenge-atomic:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});