import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Close open automated matches past expires_at
    const { error } = await supabase
      .from('match_queue')
      .update({ queue_status: 'expired' })
      .eq('automated', true)
      .eq('queue_status', 'searching')
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    console.log('Closed stale matches successfully');

    return new Response(
      JSON.stringify({ ok: true }), 
      { 
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (e) {
    console.error('Close old opens error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});