import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function with timeout to prevent lockups
async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const testMode = (Deno.env.get("TEST_MODE") || "").toLowerCase() === "true";
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // 1) Grab test profiles with funds
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, wallet_balance")
      .eq("is_test_account", true)
      .gte("wallet_balance", 5)
      .order("created_at", { ascending: true })
      .limit(8);
      
    if (pErr) throw pErr;
    if (!profiles?.length || profiles.length < 3) {
      throw new Error("Need at least 3 test profiles with funds");
    }

    // 2) Get COD game ID
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("name", "COD6")
      .single();
      
    if (!game) throw new Error("COD6 game not found");

    // 3) Create a new challenge: Multiplayer, TOP_3
    const { data: challengeInsert, error: chErr } = await supabase
      .from("challenges")
      .insert([{ 
        creator_id: profiles[0].user_id,
        game_id: game.id,
        title: "Sim Challenge " + Math.floor(Math.random() * 9999),
        stake_amount: 5,
        max_participants: 8,
        challenge_type: "Multiplayer",
        status: "open",
        platform: "Xbox"
      }])
      .select("id")
      .single();
      
    if (chErr) throw chErr;
    const challengeId = challengeInsert.id;

    // 4) Add participants using atomic join
    for (const prof of profiles) {
      const { error: jErr } = await supabase.rpc("join_challenge_atomic", {
        p_challenge_id: challengeId,
        p_user_id: prof.user_id,
        p_stake_amount: 5
      });
      if (jErr) console.error("Join error for", prof.user_id, jErr);
    }

    // 5) Start challenge
    await supabase.from("challenges").update({
      status: "in_progress",
      start_time: new Date().toISOString()
    }).eq("id", challengeId);

    // 6) Random crash? (20% chance)
    const crashed = Math.random() < 0.20;
    if (crashed) {
      // Call failure handler with timeout
      await fetchWithTimeout(`${supabaseUrl}/functions/v1/handle-match-failure`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${serviceRoleKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ matchId: challengeId, reason: "Simulated console crash" }),
      }, 10000);
      
      return new Response(JSON.stringify({ 
        ok: true, 
        challengeId, 
        crashed: true 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7) Otherwise: generate placements (first 3 = top 3)
    const p1 = profiles[0].user_id;
    const p2 = profiles[1].user_id; 
    const p3 = profiles[2].user_id;
    
    await supabase.from("challenge_stats").insert([
      { challenge_id: challengeId, user_id: p1, placement: 1, kills: 19 },
      { challenge_id: challengeId, user_id: p2, placement: 2, kills: 14 },
      { challenge_id: challengeId, user_id: p3, placement: 3, kills: 9 },
    ]);

    // 8) Process payouts with timeout and fallback
    try {
      await fetchWithTimeout(`${supabaseUrl}/functions/v1/process-match-payouts`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${serviceRoleKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ matchId: challengeId }),
      }, 10000);
    } catch {
      // Fallback to refund if payout times out
      await fetchWithTimeout(`${supabaseUrl}/functions/v1/handle-match-failure`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${serviceRoleKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          matchId: challengeId, 
          reason: "Payout timeout → auto-refund" 
        }),
      }, 10000);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      challengeId, 
      crashed: false 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in sim runner:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});