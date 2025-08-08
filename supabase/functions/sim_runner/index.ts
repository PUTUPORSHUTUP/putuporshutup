import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TEST_MODE = (Deno.env.get("TEST_MODE") || "true").toLowerCase() === "true";
const ENTRY_FEE = 5;
const CRASH_RATE = Number(Deno.env.get("SIM_CRASH_RATE") ?? "0.08"); // 8%
const FORCE_NO_CRASH = (Deno.env.get("SIM_FORCE_NO_CRASH") ?? "0").toString() === "1";

type SB = ReturnType<typeof createClient>;
const ok = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const fail = (m: string, s = 500) => ok({ ok: false, error: m }, s);

async function log(sb: SB, challengeId: string | null, step: string, note?: string) {
  try {
    await sb.from("payout_automation_log").insert({
      event_type: "sim_diag",
      entity_id: challengeId ?? "n/a",
      entity_type: "challenge",
      status: step,
      error_message: note ?? null,
    });
  } catch (e) {
    console.error("Failed to log:", e);
  }
}

// Was the last simulation a crash/refund?
async function lastRunWasCrash(sb: SB) {
  const { data } = await sb
    .from("payout_automation_log")
    .select("event_type, status, created_at")
    .in("event_type", ["refund", "sim_diag"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (!data?.length) return false;
  const d = data[0];
  return d.event_type === "refund" || d.status === "refunded";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });

  try {
    // 1) Get test profiles
    const { data: profiles, error: pErr } = await sb
      .from("profiles")
      .select("user_id, wallet_balance")
      .eq("is_test_account", true)
      .gte("wallet_balance", ENTRY_FEE)
      .order("created_at", { ascending: true })
      .limit(8);
    if (pErr) return fail(`profiles: ${pErr.message}`);
    if (!profiles || profiles.length < 3) return fail("Need >=3 test profiles");

    // 2) Get available game
    const { data: game } = await sb
      .from("games")
      .select("id")
      .limit(1)
      .single();
    if (!game) return fail("No games found in database");

    // 3) Create challenge first
    const { data: chIns, error: chErr } = await sb
      .from("challenges")
      .insert([{ 
        creator_id: profiles[0].user_id,
        game_id: game.id,
        title: "Sim Challenge " + Math.floor(Math.random() * 9999),
        stake_amount: ENTRY_FEE,
        max_participants: 8,
        challenge_type: "Multiplayer",
        status: "open",
        platform: "Xbox"
      }])
      .select("id")
      .single();
    if (chErr || !chIns?.id) return fail(`create challenge: ${chErr?.message || "no id returned"}`);
    const challengeId = chIns.id;
    await log(sb, challengeId, "challenge_created");

    // 4) Queue + escrow
    for (const prof of profiles) {
      const { error: jErr } = await sb.rpc("join_challenge_atomic", {
        p_challenge_id: challengeId,
        p_user_id: prof.user_id,
        p_stake_amount: ENTRY_FEE,
      });
      if (jErr) {
        await log(sb, challengeId, "join_error", `${prof.user_id}: ${jErr.message}`);
        console.error("Join error for", prof.user_id, jErr);
      }
    }
    await log(sb, challengeId, "players_joined");

    // 5) Activate
    const { error: aErr } = await sb
      .from("challenges")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
        lobby_id: "SIM-" + Math.floor(Math.random() * 9999).toString().padStart(4, "0"),
      })
      .eq("id", challengeId);
    if (aErr) return fail(`activate challenge: ${aErr.message}`);
    await log(sb, challengeId, "challenge_active");

    // 6) Crash logic — improved handling with reasons
    const prevCrashed = await lastRunWasCrash(sb);
    const randomCrash = Math.random() < CRASH_RATE;
    let crashed = !prevCrashed && randomCrash;
    let crashReason: string | null = null;

    // Hard override for testing
    if (FORCE_NO_CRASH) {
      crashed = false;
    }

    // When it *would* crash, record the reason
    if (!FORCE_NO_CRASH && crashed) {
      crashReason = prevCrashed ? "guard_blocked" : "random_crash";
      const res = await fetch(`${URL}/functions/v1/handle_match_failure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: challengeId, reason: "Simulated console crash" }),
      });
      const j = await res.json().catch(() => ({}));
      const refundCount = Array.isArray(j?.refunded) ? j.refunded.length
                        : typeof j?.refunded === "number" ? j.refunded : null;

      await log(sb, challengeId, "refunded", `reason=${crashReason} | http=${res.status} | refunds=${refundCount}`);
      return ok({ ok: true, challengeId, crashed: true, crashReason, refundCount });
    }

    // 7) Results
    const p1 = profiles[0].user_id, p2 = profiles[1].user_id, p3 = profiles[2].user_id;
    const { error: rErr } = await sb.from("challenge_stats").insert([
      { challenge_id: challengeId, user_id: p1, placement: 1, kills: 19 },
      { challenge_id: challengeId, user_id: p2, placement: 2, kills: 14 },
      { challenge_id: challengeId, user_id: p3, placement: 3, kills: 9 },
    ]);
    if (rErr) return fail(`write results: ${rErr.message}`);
    await log(sb, challengeId, "results_written");

    // 8) Payouts with enhanced diagnostics
    console.log("💰 Processing payouts with enhanced diagnostics...");
    const payoutResult = await callPayoutWithDiagnostics(sb, challengeId);
    console.log("Enhanced payout result:", payoutResult);
    
    if (!payoutResult.success) {
      crashReason = "payout_failed";
      await log(sb, challengeId, 'payout_failed', JSON.stringify({
        error: payoutResult.error,
        status: payoutResult.status,
        reason: 'authorization_or_network_error'
      }));
      
      // Call failure handler
      await fetch(`${URL}/functions/v1/handle_match_failure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: challengeId, reason: `Payout failed: ${payoutResult.error}` }),
      });
      await log(sb, challengeId, "refunded", `reason=${crashReason}`);
      return ok({ ok: true, challengeId, crashed: true, crashReason, error_details: payoutResult.error });
    }
    
    const payoutJson = payoutResult.data;

    await log(sb, challengeId, "payout_done");
    return ok({ ok: true, challengeId, crashed: false, crashReason: null, payout: payoutJson });
  } catch (e) {
    console.error("Error in sim runner:", e);
    await log(sb, null, "simulation_error", `Error: ${String(e)}`);
    return fail(`sim_runner: ${String(e)}`);
  }
});

// ENHANCED PAYOUT FUNCTION with comprehensive diagnostics
async function callPayoutWithDiagnostics(sb: SB, challengeId: string) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const functionUrl = `${supabaseUrl}/functions/v1/process-match-payouts`;
  
  // Enhanced diagnostic payload
  const diagPayload = {
    matchId: challengeId, // Note: using matchId for consistency
    caller: "sim_runner",
    timestamp: new Date().toISOString(),
    diagnostics: {
      hasServiceKey: !!serviceRoleKey,
      hasUrl: !!supabaseUrl,
      keyLength: serviceRoleKey?.length || 0
    }
  };

  console.log("🔍 Enhanced payout diagnostics:", {
    url: functionUrl,
    challengeId,
    payload: diagPayload,
    keyPreview: serviceRoleKey?.substring(0, 20) + "...",
    environment: {
      SUPABASE_URL: !!supabaseUrl,
      SERVICE_ROLE_KEY: !!serviceRoleKey
    }
  });

  try {
    // Method 1: Direct fetch with full diagnostics
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'X-Diag-Mode': 'full',
        'X-Caller': 'sim_runner',
        'X-Challenge-Id': challengeId
      },
      body: JSON.stringify(diagPayload)
    });
    
    const responseText = await response.text();
    
    console.log("📊 Payout response diagnostics:", {
      status: response.status,
      ok: response.ok,
      body: responseText.substring(0, 500),
      headers: Object.fromEntries(response.headers.entries())
    });

    if (response.ok) {
      await log(sb, challengeId, "payout_success", `HTTP ${response.status}`);
      return { 
        data: responseText ? JSON.parse(responseText) : {},
        success: true 
      };
    }
    
    // Log detailed error for 421 cases
    await log(sb, challengeId, 'payout_error_421', `Status: ${response.status} | Body: ${responseText} | SentAuth: Bearer ${serviceRoleKey?.substring(0, 10)}...`);
    
    return {
      error: responseText || `HTTP ${response.status}`,
      status: response.status,
      success: false
    };

  } catch (fetchError) {
    console.error("❌ Fetch error:", fetchError);
    
    await log(sb, challengeId, 'payout_fetch_error', `Error: ${fetchError.message} | Stack: ${fetchError.stack}`);
    
    return {
      error: fetchError.message,
      status: 500,
      success: false
    };
  }
}