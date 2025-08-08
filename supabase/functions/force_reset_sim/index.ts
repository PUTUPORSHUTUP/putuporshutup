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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // Find latest pending/in_progress test challenge
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id")
      .in("status", ["open", "in_progress"])
      .eq("creator_id", (await supabase.from("profiles").select("user_id").eq("is_test_account", true).limit(1).single())?.data?.user_id || "")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge?.id) {
      return new Response(JSON.stringify({ 
        ok: true, 
        note: "nothing to reset" 
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Force refund via failure handler
    await fetch(`${supabaseUrl}/functions/v1/handle-match-failure`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${serviceRoleKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        matchId: challenge.id, 
        reason: "Force reset by admin" 
      }),
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      resetChallengeId: challenge.id 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in force reset:", error);
    return new Response(JSON.stringify({ 
      error: String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});