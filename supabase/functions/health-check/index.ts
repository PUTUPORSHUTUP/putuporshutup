import "jsr:@supabase/functions-js/edge-runtime.d.ts"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient();
  const nowIso = new Date().toISOString();

  let dbOk = false, rotationFresh = false, queueFresh = false;
  let status = "ok";
  let details: Record<string, unknown> = {};

  try {
    // 1) DB reachability
    const { data: dbTest, error: dbErr } = await supabase.from("profiles").select("id").limit(1);
    if (dbErr) throw new Error("DB unreachable");
    dbOk = true;

    // 2) Rotation freshness (updated in last 10m)
    const { data: lastRotation } = await supabase
      .from("kv_counters")
      .select("updated_at")
      .eq("key", "counter:COD6:KillRace")
      .maybeSingle();

    rotationFresh = !!lastRotation &&
      Date.now() - new Date(lastRotation.updated_at!).getTime() < 10 * 60 * 1000;

    // 3) Queue freshness (new entries in last 10m)
    const { data: recentQueue, count } = await supabase
      .from("market_queue")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    queueFresh = (count ?? 0) > 0;

    // Build details and decide status
    details = {
      timestamp: nowIso,
      rotationKey: "counter:COD6:KillRace",
      queueCount: count ?? 0
    };

    if (!rotationFresh || !queueFresh) status = "error";

    // --- LOG every run ---
    await supabase.from("health_log").insert([{
      status,
      rotation_fresh: rotationFresh,
      queue_fresh: queueFresh,
      db_ok: dbOk,
      details,
      created_at: nowIso
    }]);

    // Optional: PagerDuty trigger on failure
    if (status === "error" && Deno.env.get("PAGERDUTY_KEY")) {
      await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routing_key: Deno.env.get("PAGERDUTY_KEY"),
          event_action: "trigger",
          payload: {
            summary: "PUOSU Health Check Failed",
            severity: "critical",
            source: "puosu-health",
            custom_details: { dbOk, rotationFresh, queueFresh, nowIso }
          }
        })
      });
    }

    const body = { status, db: dbOk, rotationFresh, queueFresh, timestamp: nowIso };
    return new Response(JSON.stringify(body), {
      status: status === "ok" ? 200 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    // Log hard failure (e.g., DB down)
    await safeInsert(supabase, {
      status: "error",
      rotation_fresh: rotationFresh,
      queue_fresh: queueFresh,
      db_ok: dbOk,
      details: { error: String(err) },
      created_at: nowIso
    });

    return new Response(JSON.stringify({ status: "error", message: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

async function safeInsert(supabase: any, row: any) {
  try { await supabase.from("health_log").insert([row]); } catch { /* ignore */ }
}

function createClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // @ts-ignore
  return new (await import("jsr:@supabase/supabase-js@2")).createClient(url, key, {
    auth: { persistSession: false },
  });
}