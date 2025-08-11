import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const nowISO = new Date().toISOString();

  // Close any demo match whose ends_at is in the past but still 'active'
  const { data: toClose, error: listErr } = await supabase
    .from("demo_matches")
    .select("id")
    .lt("ends_at", nowISO)
    .eq("state", "active");

  if (listErr) return new Response(JSON.stringify({ ok: false, error: listErr.message }), { status: 500 });

  let closed = 0;
  for (const m of toClose ?? []) {
    const { error: upErr } = await supabase
      .from("demo_matches")
      .update({ state: "closed" })
      .eq("id", m.id);
    if (!upErr) closed++;
  }

  console.log("[close_old_demo_matches] closed:", closed);
  return new Response(JSON.stringify({ ok: true, closed }), { status: 200 });
});