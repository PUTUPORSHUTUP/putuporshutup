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
const RANDOM_CRASH_RATE = Number(Deno.env.get("SIM_CRASH_RATE") ?? "0.08"); // 8% default

type SB = ReturnType<typeof createClient>;

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

function fail(message: string, status = 500) {
  return ok({ ok: false, error: message }, status);
}

async function logDiag(sb: SB, challengeId: string | null, step: string, note?: string) {
  try {
    await sb.from("payout_automation_log").insert({
      event_type: "sim_diag",
      entity_id: challengeId ?? "n/a",
      entity_type: "challenge",
      status: step,
      error_message: note ?? null,
    });
  } catch (e) {
    console.error("Failed to log diag:", e);
  }
}

// simple anti-cluster guard: don't crash twice in a row
async function crashedLastRun(sb: SB) {
  const { data } = await sb
    .from("payout_automation_log")
    .select("event_type, created_at")
    .eq("event_type", "sim_diag")
    .eq("status", "refunded")
    .order("created_at", { ascending: false })
    .limit(1);
  return !!data?.length;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });

  try {
    // 1) Get 8 test profiles with funds
    const { data: profiles, error: pErr } = await sb
      .from("profiles")
      .select("user_id, wallet_balance")
      .eq("is_test_account", true)
      .gte("wallet_balance", ENTRY_FEE)
      .order("created_at", { ascending: true })
      .limit(8);

    if (pErr) return fail(`profiles: ${pErr.message}`);
    if (!profiles || profiles.length < 3) return fail("Need >=3 test profiles with funds");

    // 2) Get available game
    const { data: game } = await sb
      .from("games")
      .select("id")
      .limit(1)
      .single();
      
    if (!game) return fail("No games found in database");

    // 3) Create challenge first — so we always have a challengeId to return/log
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
    await logDiag(sb, challengeId, "challenge_created");

    // 4) Join each player atomically
    for (const prof of profiles) {
      const { error: jErr } = await sb.rpc("join_challenge_atomic", {
        p_challenge_id: challengeId,
        p_user_id: prof.user_id,
        p_stake_amount: ENTRY_FEE,
      });
      if (jErr) {
        await logDiag(sb, challengeId, "join_error", `${prof.user_id}: ${jErr.message}`);
        console.error("Join error for", prof.user_id, jErr);
      }
    }
    await logDiag(sb, challengeId, "players_joined");

    // 5) Move to active (simulate match started)
    const { error: aErr } = await sb
      .from("challenges")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
        lobby_id: "SIM-" + Math.floor(Math.random() * 9999).toString().padStart(4, "0"),
      })
      .eq("id", challengeId);
    if (aErr) return fail(`activate challenge: ${aErr.message}`);
    await logDiag(sb, challengeId, "challenge_active");

    // 6) Random crash branch with anti-cluster guard
    const lastWasCrash = await crashedLastRun(sb);
    const randomCrash = Math.random() < RANDOM_CRASH_RATE;
    // crash only if random says so AND last run was NOT a crash
    const crashed = !lastWasCrash && randomCrash;
    if (crashed) {
      // Refund path
      const res = await fetch(`${URL}/functions/v1/handle-match-failure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: challengeId, reason: "Simulated console crash" }),
      });
      const j = await res.json().catch(() => ({}));
      await logDiag(sb, challengeId, "refunded", `handle_match_failure: ${res.status}`);
      return ok({ ok: true, challengeId, crashed: true, refund: j });
    }

    // 7) Results → Top 3
    const p1 = profiles[0].user_id, p2 = profiles[1].user_id, p3 = profiles[2].user_id;
    const { error: rErr } = await sb.from("challenge_stats").insert([
      { challenge_id: challengeId, user_id: p1, placement: 1, kills: 19 },
      { challenge_id: challengeId, user_id: p2, placement: 2, kills: 14 },
      { challenge_id: challengeId, user_id: p3, placement: 3, kills: 9 },
    ]);
    if (rErr) return fail(`write results: ${rErr.message}`);
    await logDiag(sb, challengeId, "results_written");

    // 8) Payouts
    const payoutRes = await fetch(`${URL}/functions/v1/process-match-payouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: challengeId }),
    });

    const payoutJson = await payoutRes.json().catch(() => ({}));
    if (!payoutRes.ok) {
      await logDiag(sb, challengeId, "payout_error", JSON.stringify(payoutJson).slice(0, 200));
      // as a safety net, refund instead of leaving it hanging
      await fetch(`${URL}/functions/v1/handle-match-failure`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: challengeId, reason: "Payout failed → auto-refund" }),
      });
      return ok({ ok: true, challengeId, crashed: true, note: "payout failed → refunded" });
    }

    await logDiag(sb, challengeId, "payout_done");
    return ok({ ok: true, challengeId, crashed: false, payout: payoutJson });
  } catch (e) {
    console.error("Error in sim runner:", e);
    return fail(`sim_runner: ${String(e)}`);
  }
});