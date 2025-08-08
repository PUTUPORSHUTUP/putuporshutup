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
    const { matchId, reason = "Console failure / timeout" } = await req.json();
    
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

    // IDEMPOTENCY CHECK: Prevent double refunding
    const { data: existingRefund } = await supabase
      .from("payout_automation_log")
      .select("id")
      .eq("entity_id", matchId)
      .eq("entity_type", "match")
      .eq("event_type", "refund")
      .eq("status", "processed")
      .maybeSingle();
    
    if (existingRefund) {
      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Match already refunded" 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get participants to refund
    const { data: participants, error: partsErr } = await supabase
      .from("match_queue")
      .select("user_id, stake_amount")
      .eq("wager_id", matchId);
      
    if (partsErr) throw partsErr;

    let refundedCount = 0;
    let totalRefunded = 0;

    // Refund each participant
    for (const participant of participants) {
      const amount = Number(participant.stake_amount || 0);
      if (amount <= 0) continue;

      const { error: refundErr } = await supabase.rpc("increment_wallet_balance", {
        user_id_param: participant.user_id,
        amount_param: amount,
        reason_param: "match_refund",
        match_id_param: matchId
      });
      
      if (refundErr) {
        console.error(`Failed to refund ${amount} to ${participant.user_id}:`, refundErr);
        continue;
      }

      refundedCount++;
      totalRefunded += amount;
    }

    // Mark match as failed
    await supabase.from("matches").update({
      state: "failed",
      failed_to_launch: true,
      failure_reason: reason,
    }).eq("id", matchId);

    // Log the failure event
    await supabase.from("payout_automation_log").insert({
      event_type: "refund",
      entity_id: matchId,
      entity_type: "match",
      status: "processed",
      error_message: reason,
      payout_amount: totalRefunded,
      processed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      refunded: refundedCount,
      totalRefunded,
      reason
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error handling match failure:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});