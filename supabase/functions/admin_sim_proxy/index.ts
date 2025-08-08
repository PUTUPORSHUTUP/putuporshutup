import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// env
const URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORS helper
function cors(res: Response) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return new Response(res.body, { status: res.status, headers: h });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

  try {
    // 1) Get caller's JWT (supabase.functions.invoke sends this automatically)
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return cors(new Response(JSON.stringify({ ok:false, code:401, message:"Missing access token" }), { status: 401 }));

    // 2) Verify user + admin flag
    const sbAnon = createClient(URL, SRK, { auth: { persistSession: false } });
    const { data: userResp, error: uErr } = await sbAnon.auth.getUser(token);
    if (uErr || !userResp?.user) return cors(new Response(JSON.stringify({ ok:false, code:401, message:"Invalid token" }), { status: 401 }));

    const uid = userResp.user.id;
    const { data: prof, error: pErr } = await sbAnon
      .from("profiles")
      .select("id,is_admin")
      .eq("id", uid)
      .single();

    if (pErr)  return cors(new Response(JSON.stringify({ ok:false, code:500, message:`Profile check failed: ${pErr.message}` }), { status: 500 }));
    if (!prof?.is_admin) return cors(new Response(JSON.stringify({ ok:false, code:403, message:"Admin only" }), { status: 403 }));

    // 3) Forward to sim_runner with Service Role header
    const body = await req.text();
    const res = await fetch(`${URL}/functions/v1/sim_runner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SRK}`,
      },
      body,
    });

    const text = await res.text();
    // pass through JSON (or error body) with same status
    return cors(new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } }));
  } catch (e) {
    return cors(new Response(JSON.stringify({ ok:false, code:500, message: String(e) }), { status: 500 }));
  }
});