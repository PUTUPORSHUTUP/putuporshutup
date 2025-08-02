import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("🎮 Tournament Engine: Starting automated tournament creation...");

    // Check if engine is running
    const { data: engineStatus } = await supabaseClient
      .from("tournament_engine_status")
      .select("*")
      .single();

    if (!engineStatus?.is_running) {
      console.log("⏸️ Tournament Engine is paused");
      return new Response(JSON.stringify({ message: "Tournament engine is paused" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get random template using the weighted function
    const { data: template, error: templateError } = await supabaseClient
      .rpc("get_random_tournament_template");

    if (templateError || !template) {
      console.error("❌ Failed to get tournament template:", templateError);
      throw new Error("Failed to get tournament template");
    }

    console.log(`🎯 Selected template: ${template.template_name} - $${template.entry_fee}`);

    // Create new tournament
    const startTime = new Date(Date.now() + 5 * 60 * 1000); // Start in 5 minutes
    const endTime = new Date(startTime.getTime() + template.duration_minutes * 60 * 1000);

    const { data: tournament, error: tournamentError } = await supabaseClient
      .from("tournaments")
      .insert({
        title: `${template.template_name} - ${startTime.toLocaleTimeString()}`,
        description: `Auto-generated ${template.game_mode} tournament. Entry: $${template.entry_fee}`,
        entry_fee: template.entry_fee,
        max_participants: template.max_participants,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "open",
        game_mode: template.game_mode,
        tournament_type: "automated",
        prize_distribution: template.prize_distribution,
        created_by_automation: true
      })
      .select()
      .single();

    if (tournamentError) {
      console.error("❌ Failed to create tournament:", tournamentError);
      throw new Error("Failed to create tournament");
    }

    console.log(`✅ Created tournament: ${tournament.title} (ID: ${tournament.id})`);

    // Update engine status
    await supabaseClient
      .from("tournament_engine_status")
      .update({
        last_tournament_created_at: new Date().toISOString(),
        next_tournament_scheduled_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // Next in 20 minutes
        tournaments_created_today: engineStatus.tournaments_created_today + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", engineStatus.id);

    // Log automated action
    await supabaseClient
      .from("automated_actions")
      .insert({
        automation_type: "tournament_engine",
        action_type: "create_tournament",
        success: true,
        action_data: {
          tournament_id: tournament.id,
          template_name: template.template_name,
          entry_fee: template.entry_fee,
          max_participants: template.max_participants,
          start_time: startTime.toISOString()
        }
      });

    return new Response(JSON.stringify({
      success: true,
      tournament: {
        id: tournament.id,
        title: tournament.title,
        entry_fee: tournament.entry_fee,
        max_participants: tournament.max_participants,
        start_time: tournament.start_time,
        game_mode: tournament.game_mode
      },
      next_tournament_in_minutes: 20
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Tournament Engine Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});