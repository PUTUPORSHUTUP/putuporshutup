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
    const timeoutMinutes = Number(Deno.env.get("LAUNCH_TIMEOUT_MINUTES") ?? "10");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // Find stuck matches using our helper function
    const { data: stuckMatches, error: stuckErr } = await supabase.rpc("find_stuck_matches", {
      p_minutes: timeoutMinutes
    });
    
    if (stuckErr) throw stuckErr;

    const processedMatches = [];

    // Process each stuck match
    for (const match of stuckMatches || []) {
      try {
        // Call the failure handler
        const response = await fetch(`${supabaseUrl}/functions/v1/handle-match-failure`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            matchId: match.id, 
            reason: `Auto watchdog: launch timeout after ${timeoutMinutes} minutes` 
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to process match ${match.id}: ${response.statusText}`);
        }

        const result = await response.json();
        processedMatches.push({
          matchId: match.id,
          result
        });

      } catch (error) {
        console.error(`Error processing stuck match ${match.id}:`, error);
        processedMatches.push({
          matchId: match.id,
          error: String(error)
        });
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      timeoutMinutes,
      foundStuckMatches: (stuckMatches || []).length,
      processedMatches
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in watchdog refund failures:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});