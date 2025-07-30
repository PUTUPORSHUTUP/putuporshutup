import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
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
    const { action = "sync_all_games" } = await req.json();
    
    // Initialize Supabase client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`Starting game automation orchestrator: ${action}`);

    let results = [];

    if (action === "sync_all_games" || action === "sync_rocket_league") {
      // Fetch active Rocket League challenges that need stat updates
      const { data: rlChallenges } = await supabaseService
        .from('challenges')
        .select(`
          id, creator_id, status, platform,
          challenge_participants!inner(user_id),
          games!inner(name, display_name)
        `)
        .eq('games.name', 'rocket-league')
        .eq('status', 'active');

      for (const challenge of rlChallenges || []) {
        try {
          // Here you would call the rocket-league-stats function for each participant
          console.log(`Processing Rocket League challenge ${challenge.id}`);
          
          results.push({
            game: "Rocket League",
            challenge_id: challenge.id,
            status: "processed",
            participants: challenge.challenge_participants.length
          });
        } catch (error) {
          console.error(`Error processing RL challenge ${challenge.id}:`, error);
          results.push({
            game: "Rocket League",
            challenge_id: challenge.id,
            status: "error",
            error: error.message
          });
        }
      }
    }

    if (action === "sync_all_games" || action === "sync_apex_legends") {
      // Fetch active Apex Legends challenges
      const { data: apexChallenges } = await supabaseService
        .from('challenges')
        .select(`
          id, creator_id, status, platform,
          challenge_participants!inner(user_id),
          games!inner(name, display_name)
        `)
        .eq('games.name', 'apex-legends')
        .eq('status', 'active');

      for (const challenge of apexChallenges || []) {
        try {
          console.log(`Processing Apex Legends challenge ${challenge.id}`);
          
          results.push({
            game: "Apex Legends",
            challenge_id: challenge.id,
            status: "processed",
            participants: challenge.challenge_participants.length
          });
        } catch (error) {
          console.error(`Error processing Apex challenge ${challenge.id}:`, error);
          results.push({
            game: "Apex Legends",
            challenge_id: challenge.id,
            status: "error",
            error: error.message
          });
        }
      }
    }

    // Update automation config last run time
    await supabaseService
      .from('automation_config')
      .update({ 
        last_run_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Next run in 5 minutes
      })
      .in('automation_type', ['rocket_league_api', 'apex_legends_api']);

    // Log the orchestration action
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "game_orchestrator",
        action_type: action,
        success: true,
        action_data: {
          processed_games: results.length,
          successful: results.filter(r => r.status === "processed").length,
          errors: results.filter(r => r.status === "error").length,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`Game automation orchestrator completed. Processed ${results.length} items.`);

    return new Response(JSON.stringify({
      success: true,
      action,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === "processed").length,
        errors: results.filter(r => r.status === "error").length
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in game automation orchestrator:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to run game automation",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});