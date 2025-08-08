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
    // COMPREHENSIVE HEADER DIAGNOSTICS
    const headers: Record<string, string> = {};
    for (const [key, value] of req.headers.entries()) {
      headers[key] = value;
    }
    
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isDiagMode = req.headers.get('X-Diag-Mode') === 'full';
    const callerInfo = req.headers.get('X-Caller') || 'unknown';
    const challengeId = req.headers.get('X-Challenge-Id') || 'unknown';
    
    console.log("🔍 Process-match-payouts FULL DIAGNOSTICS:", {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      receivedHeaders: headers,
      authDetails: {
        authHeaderPresent: !!authHeader,
        authHeaderStart: authHeader?.substring(0, 20) + "...",
        expectedStart: `Bearer ${serviceRoleKey?.substring(0, 10)}...`,
        authHeaderLength: authHeader?.length || 0,
        expectedLength: serviceRoleKey ? `Bearer ${serviceRoleKey}`.length : 0,
        exactMatch: authHeader === `Bearer ${serviceRoleKey}`
      },
      environment: {
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SERVICE_ROLE_KEY: !!serviceRoleKey,
        serviceRoleKeyLength: serviceRoleKey?.length || 0
      },
      callerInfo: {
        caller: callerInfo,
        challengeId: challengeId,
        isDiagnosticMode: isDiagMode
      }
    });
    
    // ENHANCED AUTH VALIDATION with detailed diagnostics
    if (!authHeader) {
      const diagnosticResponse = {
        code: 421,
        message: "Missing authorization header",
        timestamp: new Date().toISOString(),
        diagnostic: {
          received_headers: headers,
          expected_auth_format: `Bearer ${serviceRoleKey?.substring(0, 10)}...`,
          env_vars: {
            SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
            SERVICE_ROLE_KEY: !!serviceRoleKey,
            service_key_length: serviceRoleKey?.length || 0
          },
          caller_info: {
            caller: callerInfo,
            challenge_id: challengeId
          },
          troubleshooting: {
            check_edge_function_secrets: "Run: supabase secrets list",
            verify_header_propagation: "Check sim_runner Authorization header sending",
            check_function_deployment: "Verify both functions deployed to same project"
          }
        }
      };
      
      console.error("❌ AUTH FAILURE - Missing header:", diagnosticResponse);
      
      return new Response(JSON.stringify(diagnosticResponse), { 
        status: 421,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      const diagnosticResponse = {
        code: 421,
        message: "Invalid authorization header",
        timestamp: new Date().toISOString(),
        diagnostic: {
          received_auth: authHeader?.substring(0, 30) + "...",
          expected_auth: `Bearer ${serviceRoleKey?.substring(0, 15)}...`,
          comparison: {
            receivedLength: authHeader?.length || 0,
            expectedLength: `Bearer ${serviceRoleKey}`.length,
            startsWithBearer: authHeader?.startsWith('Bearer ') || false,
            keyPortionMatches: authHeader?.substring(7) === serviceRoleKey
          },
          troubleshooting: {
            check_service_role_key: "Verify SUPABASE_SERVICE_ROLE_KEY is identical in both functions",
            check_header_format: "Ensure Authorization: Bearer [key] format",
            verify_no_trailing_spaces: "Check for whitespace in environment variables"
          }
        }
      };
      
      console.error("❌ AUTH FAILURE - Invalid header:", diagnosticResponse);
      
      return new Response(JSON.stringify(diagnosticResponse), { 
        status: 421,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("✅ Authorization validated successfully - proceeding with payout processing");
    const { matchId } = await req.json();

    if (!matchId) {
      return new Response(JSON.stringify({ error: "matchId required" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    console.log(`Processing payout for challenge: ${matchId}`);

    // SETTLEMENT IDEMPOTENCY: Prevent double processing using new function
    const { data: canSettle, error: settleErr } = await supabase.rpc("mark_challenge_settled", {
      p_challenge_id: matchId
    });

    if (settleErr) {
      console.error("Settlement check failed:", settleErr);
      throw new Error(`Settlement check failed: ${settleErr.message}`);
    }

    if (!canSettle) {
      console.log("Challenge already settled, skipping payout");
      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Challenge already processed" 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get challenge details (using correct table name)
    const { data: challenge, error: challengeErr } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", matchId)
      .single();
      
    if (challengeErr || !challenge) {
      console.error("Challenge not found:", challengeErr);
      throw challengeErr || new Error("Challenge not found");
    }

    // Get participants (using correct table name)
    const { data: participants, error: partsErr } = await supabase
      .from("challenge_participants")
      .select("user_id, stake_paid")
      .eq("challenge_id", matchId);
      
    if (partsErr) {
      console.error("Failed to get participants:", partsErr);
      throw partsErr;
    }

    // Get results (using correct table name)
    const { data: results, error: resErr } = await supabase
      .from("challenge_stats")
      .select("user_id, placement, kills")
      .eq("challenge_id", matchId)
      .order("placement", { ascending: true });
      
    if (resErr) {
      console.error("Failed to get results:", resErr);
      throw resErr;
    }

    console.log(`Found ${participants.length} participants, ${results.length} results`);

    if (results.length === 0) {
      throw new Error("No results found for challenge");
    }

    const totalPot = participants.reduce((s, p) => s + Number(p.stake_paid || 0), 0);
    const feeRate = 0.10; // 10% platform fee
    const netPot = totalPot * (1 - feeRate);

    console.log(`Total pot: $${totalPot}, Net pot after fees: $${netPot}`);

    // Determine payouts - using challenge_type instead of payout_type
    type Payout = { player_id: string; amount: number };
    const payouts: Payout[] = [];

    if (challenge.challenge_type === "1v1") {
      // Winner takes all for 1v1
      const winner = results.find(r => r.placement === 1);
      if (!winner) throw new Error("No winner recorded for 1v1 challenge");
      
      const winAmount = Number(netPot.toFixed(2));
      payouts.push({ 
        player_id: winner.user_id, 
        amount: winAmount
      });
      console.log(`1v1 payout: ${winner.user_id} gets $${winAmount}`);
    } else {
      // TOP_3 split for multiplayer
      const p1 = results.find(r => r.placement === 1);
      const p2 = results.find(r => r.placement === 2);
      const p3 = results.find(r => r.placement === 3);
      
      if (!p1) throw new Error("No first place winner found");
      
      if (p2 && p3) {
        // Full top 3 split
        const amounts = [
          Number((netPot * 0.6).toFixed(2)),
          Number((netPot * 0.3).toFixed(2)),
          Number((netPot * 0.1).toFixed(2))
        ];
        payouts.push({ player_id: p1.user_id, amount: amounts[0] });
        payouts.push({ player_id: p2.user_id, amount: amounts[1] });
        payouts.push({ player_id: p3.user_id, amount: amounts[2] });
        console.log(`Top 3 payouts: 1st=$${amounts[0]}, 2nd=$${amounts[1]}, 3rd=${amounts[2]}`);
      } else {
        // Winner takes all if insufficient placements
        const winAmount = Number(netPot.toFixed(2));
        payouts.push({ player_id: p1.user_id, amount: winAmount });
        console.log(`Winner takes all: ${p1.user_id} gets $${winAmount}`);
      }
    }

    // CREDIT wallets atomically with audit trail
    console.log("Starting wallet payouts...");
    for (const payout of payouts) {
      console.log(`Paying ${payout.player_id}: $${payout.amount}`);
      
      const { error: payoutErr } = await supabase.rpc("increment_wallet_balance", {
        user_id_param: payout.player_id,
        amount_param: payout.amount,
        reason_param: "challenge_payout",
        challenge_id_param: matchId
      });
      
      if (payoutErr) {
        console.error(`Payout failed for ${payout.player_id}:`, payoutErr);
        throw new Error(`Payout failed: ${payoutErr.message}`);
      }

      // Log payout with correct entity_type
      await supabase.from("payout_automation_log").insert({
        event_type: "payout",
        entity_id: matchId,
        entity_type: "challenge",
        payout_amount: payout.amount,
        winner_id: payout.player_id,
        status: "processed",
        processed_at: new Date().toISOString(),
      });
      
      console.log(`Successfully paid ${payout.player_id}: $${payout.amount}`);
    }

    // Mark challenge as completed (using correct table name)
    await supabase.from("challenges").update({ 
      status: "completed",
      end_time: new Date().toISOString()
    }).eq("id", matchId);

    console.log(`Challenge ${matchId} payout completed successfully`);

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
    
    // Log to database for monitoring
    try {
      await supabase.from('payout_automation_log').insert({
        entity_id: null,
        entity_type: 'system',
        event_type: 'error',
        status: 'failed',
        error_message: String(error)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      code: 500,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});