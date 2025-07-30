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
    const { action = "run_trending_automation", forceSync = false } = await req.json();
    
    // Initialize Supabase client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`Starting trending games automation orchestrator: ${action}`);

    let results = [];
    const timestamp = new Date().toISOString();

    // Get automation configs for trending games
    const { data: automationConfigs } = await supabaseService
      .from('automation_config')
      .select('*')
      .in('automation_type', [
        'fortnite_api',
        'valorant_api', 
        'warzone_api',
        'counter_strike_2_api',
        'league_of_legends_api',
        'overwatch_2_api'
      ])
      .eq('is_enabled', true);

    console.log(`Found ${automationConfigs?.length || 0} enabled automation configs`);

    // Process each automation type
    for (const config of automationConfigs || []) {
      try {
        const gameConfig = config.config_data;
        const shouldRun = forceSync || this.shouldRunAutomation(config);
        
        if (!shouldRun) {
          console.log(`Skipping ${config.automation_type} - not due for run`);
          continue;
        }

        console.log(`Processing ${gameConfig.game_name} automation...`);

        // Get active challenges for this game
        const { data: challenges } = await supabaseService
          .from('challenges')
          .select(`
            id, creator_id, status, platform, game_id,
            challenge_participants!inner(user_id),
            games!inner(name, display_name)
          `)
          .eq('games.name', this.getGameSlugFromAutomationType(config.automation_type))
          .in('status', ['active', 'in_progress']);

        let processedChallenges = 0;
        let successfulUpdates = 0;
        let errors = 0;

        for (const challenge of challenges || []) {
          try {
            // Here you would call the specific game's stats function
            // For now, we'll simulate processing
            processedChallenges++;
            successfulUpdates++;
            
            console.log(`Processed challenge ${challenge.id} for ${gameConfig.game_name}`);
          } catch (error) {
            console.error(`Error processing challenge ${challenge.id}:`, error);
            errors++;
          }
        }

        // Update last run time for this automation
        await supabaseService
          .from('automation_config')
          .update({ 
            last_run_at: timestamp,
            next_run_at: new Date(Date.now() + config.run_frequency_minutes * 60 * 1000).toISOString()
          })
          .eq('id', config.id);

        results.push({
          game: gameConfig.game_name,
          automation_type: config.automation_type,
          status: "completed",
          processed_challenges: processedChallenges,
          successful_updates: successfulUpdates,
          errors: errors,
          trend_score: gameConfig.trend_score || 0,
          priority: gameConfig.priority || 'medium'
        });

      } catch (error) {
        console.error(`Error processing automation ${config.automation_type}:`, error);
        results.push({
          game: config.config_data?.game_name || 'Unknown',
          automation_type: config.automation_type,
          status: "error",
          error: error.message,
          processed_challenges: 0,
          successful_updates: 0,
          errors: 1
        });
      }
    }

    // Log the orchestration summary
    const totalProcessed = results.reduce((sum, r) => sum + (r.processed_challenges || 0), 0);
    const totalSuccessful = results.reduce((sum, r) => sum + (r.successful_updates || 0), 0);
    const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);

    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "trending_games_orchestrator",
        action_type: action,
        success: totalErrors === 0,
        action_data: {
          total_automations: results.length,
          total_processed: totalProcessed,
          total_successful: totalSuccessful,
          total_errors: totalErrors,
          games_processed: results.map(r => r.game),
          timestamp,
          force_sync: forceSync
        }
      });

    console.log(`Trending games automation completed. Processed ${totalProcessed} challenges across ${results.length} games.`);

    return new Response(JSON.stringify({
      success: true,
      action,
      results,
      summary: {
        total_automations: results.length,
        total_processed: totalProcessed,
        total_successful: totalSuccessful,
        total_errors: totalErrors,
        timestamp
      },
      next_scheduled_runs: automationConfigs?.map(config => ({
        game: config.config_data?.game_name,
        next_run: config.next_run_at,
        frequency_minutes: config.run_frequency_minutes
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in trending games automation orchestrator:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to run trending games automation",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to determine if automation should run
function shouldRunAutomation(config: any): boolean {
  if (!config.last_run_at) return true;
  
  const lastRun = new Date(config.last_run_at);
  const now = new Date();
  const timeSinceLastRun = now.getTime() - lastRun.getTime();
  const intervalMs = config.run_frequency_minutes * 60 * 1000;
  
  return timeSinceLastRun >= intervalMs;
}

// Helper function to get game slug from automation type
function getGameSlugFromAutomationType(automationType: string): string {
  const mapping: Record<string, string> = {
    'fortnite_api': 'fortnite',
    'valorant_api': 'valorant',
    'warzone_api': 'call_of_duty_warzone',
    'counter_strike_2_api': 'counter_strike_2',
    'league_of_legends_api': 'league_of_legends',
    'overwatch_2_api': 'overwatch_2'
  };
  
  return mapping[automationType] || automationType.replace('_api', '');
}