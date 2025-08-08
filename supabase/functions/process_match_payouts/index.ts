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

    // IDEMPOTENCY CHECK: Prevent double processing
    const { data: existingPayout } = await supabase
      .from("payout_automation_log")
      .select("id")
      .eq("entity_id", matchId)
      .eq("entity_type", "match")
      .eq("event_type", "payout")
      .eq("status", "processed")
      .maybeSingle();
    
    if (existingPayout) {
      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Match already processed" 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get match details
    const { data: match, error: matchErr } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", matchId)
      .single();
      
    if (matchErr || !match) {
      throw matchErr || new Error("Match not found");
    }

    // Get participants
    const { data: participants, error: partsErr } = await supabase
      .from("challenge_participants")
      .select("user_id, stake_paid")
      .eq("challenge_id", matchId);
      
    if (partsErr) throw partsErr;

    // Get results
    const { data: results, error: resErr } = await supabase
      .from("challenge_stats")
      .select("user_id, placement, kills")
      .eq("challenge_id", matchId)
      .order("placement", { ascending: true });
      
    if (resErr) throw resErr;

    const totalPot = participants.reduce((s, p) => s + Number(p.stake_paid || 0), 0);
    const feeRate = 0.10; // 10% platform fee
    const netPot = totalPot * (1 - feeRate);

    // Determine payouts
    type Payout = { user_id: string; amount: number };
    const payouts: Payout[] = [];

    if (match.challenge_type === "1v1") {
      const winner = results.find(r => r.placement === 1);
      if (!winner) throw new Error("No winner recorded");
      payouts.push({ 
        user_id: winner.user_id, 
        amount: Number(netPot.toFixed(2)) 
      });
    } else {
      // TOP_3 split: 50% / 30% / 20%
      const p1 = results.find(r => r.placement === 1);
      const p2 = results.find(r => r.placement === 2);
      const p3 = results.find(r => r.placement === 3);
      
      if (!p1 || !p2 || !p3) {
        throw new Error("Top 3 results missing");
      }
      
      payouts.push({ 
        user_id: p1.user_id, 
        amount: Number((netPot * 0.5).toFixed(2)) 
      });
      payouts.push({ 
        user_id: p2.user_id, 
        amount: Number((netPot * 0.3).toFixed(2)) 
      });
      payouts.push({ 
        user_id: p3.user_id, 
        amount: Number((netPot * 0.2).toFixed(2)) 
      });
    }

    // CREDIT wallets atomically with audit trail
    for (const payout of payouts) {
      const { error: payoutErr } = await supabase.rpc("increment_wallet_balance", {
        user_id_param: payout.user_id,
        amount_param: payout.amount,
        reason_param: "match_payout",
        challenge_id_param: matchId
      });
      
      if (payoutErr) throw payoutErr;

      // Log payout
      await supabase.from("payout_automation_log").insert({
        event_type: "payout",
        entity_id: matchId,
        entity_type: "match",
        payout_amount: payout.amount,
        winner_id: payout.user_id,
        status: "processed",
        processed_at: new Date().toISOString(),
      });
    }

    // Mark challenge as completed
    await supabase.from("challenges").update({ 
      status: "completed" 
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