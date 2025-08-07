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
    const { matchId } = await req.json();

    if (!matchId) {
      return new Response(JSON.stringify({ error: "matchId required" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // Get match details
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
      
    if (matchErr || !match) {
      throw matchErr || new Error("Match not found");
    }

    // Get participants
    const { data: participants, error: partsErr } = await supabase
      .from("match_queue")
      .select("user_id, entry_fee")
      .eq("match_id", matchId);
      
    if (partsErr) throw partsErr;

    // Get results
    const { data: results, error: resErr } = await supabase
      .from("match_results")
      .select("player_id, placement, kills")
      .eq("match_id", matchId)
      .order("placement", { ascending: true });
      
    if (resErr) throw resErr;

    const totalPot = participants.reduce((s, p) => s + Number(p.entry_fee || 0), 0);
    const feeRate = 0.10; // 10% platform fee
    const netPot = totalPot * (1 - feeRate);

    // Determine payouts
    type Payout = { player_id: string; amount: number };
    const payouts: Payout[] = [];

    if (match.payout_type === "WINNER_TAKE_ALL") {
      const winner = results.find(r => r.placement === 1);
      if (!winner) throw new Error("No winner recorded");
      payouts.push({ 
        player_id: winner.player_id, 
        amount: Number(netPot.toFixed(2)) 
      });
    } else {
      // TOP_3 split
      const p1 = results.find(r => r.placement === 1);
      const p2 = results.find(r => r.placement === 2);
      const p3 = results.find(r => r.placement === 3);
      
      if (!p1 || !p2 || !p3) {
        throw new Error("Top 3 results missing");
      }
      
      payouts.push({ 
        player_id: p1.player_id, 
        amount: Number((netPot * 0.6).toFixed(2)) 
      });
      payouts.push({ 
        player_id: p2.player_id, 
        amount: Number((netPot * 0.3).toFixed(2)) 
      });
      payouts.push({ 
        player_id: p3.player_id, 
        amount: Number((netPot * 0.1).toFixed(2)) 
      });
    }

    // Process payouts
    for (const payout of payouts) {
      const { error: payoutErr } = await supabase.rpc("increment_wallet_balance", {
        user_id_param: payout.player_id,
        amount_param: payout.amount,
      });
      
      if (payoutErr) throw payoutErr;

      // Log payout
      await supabase.from("payout_automation_log").insert({
        event_type: "payout",
        entity_id: matchId,
        entity_type: "match",
        payout_amount: payout.amount,
        winner_id: payout.player_id,
        status: "processed",
        processed_at: new Date().toISOString(),
      });
    }

    // Mark match as completed
    await supabase.from("matches").update({ 
      state: "completed" 
    }).eq("id", matchId);

    return new Response(JSON.stringify({ 
      ok: true, 
      payouts,
      totalPot,
      netPot,
      feeCollected: totalPot - netPot
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error processing match payouts:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});