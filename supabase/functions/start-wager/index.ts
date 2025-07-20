import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseService.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { wager_id } = await req.json();
    
    if (!wager_id) {
      throw new Error("Wager ID required");
    }

    console.log("Starting wager:", wager_id, "by user:", user.id);

    // Get wager details
    const { data: wager, error: wagerError } = await supabaseService
      .from("wagers")
      .select(`
        *,
        wager_participants(*)
      `)
      .eq("id", wager_id)
      .eq("status", "open")
      .single();

    if (wagerError || !wager) {
      throw new Error("Wager not found or not open");
    }

    // Check if user is the creator
    if (wager.creator_id !== user.id) {
      throw new Error("Only the wager creator can start the match");
    }

    // Check if wager is full (including creator)
    const totalParticipants = wager.wager_participants.length + 1; // +1 for creator
    if (totalParticipants < wager.max_participants) {
      throw new Error(`Wager is not full yet (${totalParticipants}/${wager.max_participants} players)`);
    }

    // Start the wager
    await supabaseService
      .from("wagers")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", wager_id);

    console.log("Wager started successfully:", wager_id);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Wager started! Players can now report match results."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Start wager error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to start wager" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});