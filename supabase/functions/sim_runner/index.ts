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

    // 8) Payouts - Enhanced with fallback mechanism
    const payoutResponse = await callPayoutFunction(sb, challengeId);
    
    if (payoutResponse.error) {
      crashReason = "payout_failed";
      await log(sb, challengeId, "payout_error", `Error: ${payoutResponse.error}`);
      await fetch(`${URL}/functions/v1/handle_match_failure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: challengeId, reason: `Payout failed: ${payoutResponse.error}` }),
      });
      await log(sb, challengeId, "refunded", `reason=${crashReason}`);
      return ok({ ok: true, challengeId, crashed: true, crashReason, refundCount: null });
    }
    const payoutJson = payoutResponse.data;

    await log(sb, challengeId, "payout_done");
    return ok({ ok: true, challengeId, crashed: false, crashReason: null, payout: payoutJson });
  } catch (e) {
    console.error("Error in sim runner:", e);
    await log(sb, null, "simulation_error", `Error: ${String(e)}`);
    return fail(`sim_runner: ${String(e)}`);
  }
});

// Enhanced payout caller with fallback mechanisms
async function callPayoutFunction(sb: SB, challengeId: string) {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const functionUrl = `${URL}/functions/v1/process-match-payouts`;
  
  console.log('Calling payout function for challenge:', challengeId);
  
  // Attempt 1: Use supabase.functions.invoke
  try {
    console.log('Attempting supabase.functions.invoke...');
    const response = await sb.functions.invoke('process-match-payouts', {
      body: { matchId: challengeId },
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.error) {
      console.log('supabase.functions.invoke succeeded');
      return response;
    }
    console.error('supabase.functions.invoke failed:', response.error);
  } catch (invokeError) {
    console.error('supabase.functions.invoke threw error:', invokeError);
  }
  
  // Attempt 2: Direct fetch fallback
  try {
    console.log('Attempting direct fetch fallback...');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matchId: challengeId })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Direct fetch succeeded');
      return { data };
    }
    
    const errorText = await response.text();
    console.error(`Direct fetch failed: HTTP ${response.status}: ${errorText}`);
    return { error: `HTTP ${response.status}: ${errorText}` };
  } catch (fetchError) {
    console.error('Direct fetch threw error:', fetchError);
    return { error: `Fetch error: ${fetchError.message}` };
  }
}