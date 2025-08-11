import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // If an active match already exists starting in next 30 min, skip
  const now = new Date();
  const nextStart = new Date(Math.ceil(now.getTime() / (30*60*1000)) * (30*60*1000)); // round up to next 30
  const nextEnd = new Date(nextStart.getTime() + 30*60*1000);

  const { data: existing, error: exErr } = await supabase
    .from("demo_matches")
    .select("*")
    .gte("starts_at", new Date(now.getTime() - 5*60*1000).toISOString())
    .lte("starts_at", new Date(nextStart.getTime() + 1).toISOString())
    .eq("state", "active")
    .limit(1);

  if (exErr) return new Response(JSON.stringify({ ok: false, error: exErr.message }), { status: 500 });

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "match already scheduled" }), { status: 200 });
  }

  const { data: created, error } = await supabase
    .from("demo_matches")
    .insert({
      game: "Call of Duty",
      mode: "Multiplayer",
      platform: "Xbox Series X",
      starts_at: nextStart.toISOString(),
      ends_at: nextEnd.toISOString(),
      state: "active",
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

  console.log("[create_free_demo_match] created", created.id, created.starts_at);
  return new Response(JSON.stringify({ ok: true, id: created.id }), { status: 200 });
});