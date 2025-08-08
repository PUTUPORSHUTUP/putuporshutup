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
    // 1) Get available test users using the robust function
    const { data: testUsers, error: testErr } = await sb.rpc("get_available_test_users", {
      min_balance: ENTRY_FEE,
      max_users: 8
    });
    
    if (testErr) {
      await log(sb, null, "test_user_error", `Failed to get test users: ${testErr.message}`);
      return fail(`get test users: ${testErr.message}`);
    }
    
    if (!testUsers || testUsers.length < 3) {
      await log(sb, null, "insufficient_test_users", `Only found ${testUsers?.length || 0} test users, need at least 3`);
      
      // Log detailed error information
      const { data: allProfiles } = await sb.from("profiles").select("id, user_id, wallet_balance, is_test_account").limit(20);
      const testAccounts = allProfiles?.filter(p => p.is_test_account) || [];
      const withBalance = testAccounts.filter(p => (p.wallet_balance || 0) >= ENTRY_FEE);
      
      await log(sb, null, "test_user_diagnostics", 
        `Total profiles: ${allProfiles?.length || 0}, Test accounts: ${testAccounts.length}, With sufficient balance: ${withBalance.length}`);
      
      return fail(`Insufficient test users: found ${testUsers?.length || 0}, need at least 3. Check test account setup.`);
    }
    
    const profiles = testUsers;

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
    const lastWasCrash = await lastRunWasCrash(sb);
    const forceNoCrash = FORCE_NO_CRASH;
    const shouldCrash = !forceNoCrash && (lastWasCrash ? false : Math.random() < CRASH_RATE);
    
    if (shouldCrash) {
      const crashReasons = [
        "server_timeout", "network_error", "host_disconnect", "anti_cheat_kick",
        "lobby_full", "connection_lost", "game_update", "maintenance_mode"
      ];
      const reason = crashReasons[Math.floor(Math.random() * crashReasons.length)];
      
      await log(sb, challengeId, "crash_detected", `Simulated crash: ${reason}`);
      
      const { error: crashErr } = await sb.rpc("handle_match_failure", {
        p_match_id: challengeId,
        p_failure_reason: reason,
        p_refund_type: "full"
      });
      
      if (crashErr) {
        await log(sb, challengeId, "crash_handling_failed", crashErr.message);
        return fail(`Crash handling failed: ${crashErr.message}`);
      }
      
      await log(sb, challengeId, "refunded");
      console.log(`Crash simulated (${reason}), participants refunded`);
      return ok({ 
        challengeId, 
        outcome: "crashed", 
        reason,
        message: `Challenge crashed due to ${reason}, all participants refunded`
      });
    }

    // 7) Record results
    const results = [
      { user_id: profiles[0].user_id, placement: 1, kills: 15, deaths: 3 },
      { user_id: profiles[1].user_id, placement: 2, kills: 12, deaths: 5 },
      { user_id: profiles[2].user_id, placement: 3, kills: 8, deaths: 8 }
    ];

    for (const result of results) {
      await sb.from("challenge_stats").insert({
        challenge_id: challengeId,
        user_id: result.user_id,
        placement: result.placement,
        kills: result.kills,
        deaths: result.deaths,
        verified: true
      });
    }
    await log(sb, challengeId, "results_written");

    // 8) DIRECT PAYOUT CALL - Skip admin_sim_proxy entirely
    console.log("Calling payout processor directly...");
    try {
      const payoutResponse = await fetch(`${URL}/functions/v1/process-match-payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          'X-Challenge-Id': challengeId,
          'X-Caller': 'sim_runner_direct'
        },
        body: JSON.stringify({ matchId: challengeId })
      });

      const payoutData = await payoutResponse.text();
      
      if (!payoutResponse.ok) {
        await log(sb, challengeId, "payout_error", `HTTP ${payoutResponse.status}: ${payoutData}`);
        console.error("Payout failed:", payoutData);
        return fail(`Payout failed: ${payoutData}`);
      }

      await log(sb, challengeId, "payout_completed");
      console.log("Payout completed successfully");
      
    } catch (payoutErr) {
      await log(sb, challengeId, "payout_error", `Fetch error: ${payoutErr.message}`);
      console.error("Payout error:", payoutErr);
      return fail(`Payout error: ${payoutErr.message}`);
    }

    // 9) Final result
    await log(sb, challengeId, "simulation_complete");
    return ok({ 
      ok: true, 
      challengeId, 
      outcome: "completed",
      participants: profiles.length,
      winner: profiles[0].user_id,
      message: "Simulation completed successfully"
    });
  } catch (e) {
    console.error("Error in sim runner:", e);
    await log(sb, null, "simulation_error", `Error: ${String(e)}`);
    return fail(`sim_runner: ${String(e)}`);
});