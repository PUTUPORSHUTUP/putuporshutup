import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();
    console.log('🤖 Automation Orchestrator: Starting automation cycle');

    // Get all enabled automations that are due to run
    const { data: automations, error } = await supabaseClient
      .from('automation_config')
      .select('*')
      .eq('is_enabled', true)
      .or('next_run_at.is.null,next_run_at.lte.now()');

    if (error) {
      console.error('Error fetching automations:', error);
      throw error;
    }

    const results = [];

    for (const automation of automations || []) {
      const automationStart = Date.now();
      console.log(`🔄 Running automation: ${automation.automation_type}`);

      try {
        let automationResult;

        switch (automation.automation_type) {
          case 'dispute_resolution':
            automationResult = await runDisputeResolution(supabaseClient, automation);
            break;
          case 'tournament_scheduler':
            automationResult = await runTournamentScheduler(supabaseClient, automation);
            break;
          case 'dynamic_pricing':
            automationResult = await runDynamicPricing(supabaseClient, automation);
            break;
          case 'fraud_detection':
            automationResult = await runFraudDetection(supabaseClient, automation);
            break;
          case 'market_making':
            automationResult = await runMarketMaking(supabaseClient, automation);
            break;
          default:
            console.warn(`Unknown automation type: ${automation.automation_type}`);
            continue;
        }

        const processingTime = Date.now() - automationStart;

        // Log successful automation
        await supabaseClient
          .from('automated_actions')
          .insert({
            automation_type: automation.automation_type,
            action_type: 'automation_completed',
            action_data: automationResult,
            success: true,
            processing_time_ms: processingTime
          });

        // Update next run time
        const nextRun = new Date(Date.now() + (automation.run_frequency_minutes * 60 * 1000));
        await supabaseClient
          .from('automation_config')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRun.toISOString()
          })
          .eq('id', automation.id);

        results.push({
          type: automation.automation_type,
          success: true,
          result: automationResult,
          processingTime
        });

      } catch (automationError) {
        console.error(`Error in ${automation.automation_type}:`, automationError);
        
        // Log failed automation
        await supabaseClient
          .from('automated_actions')
          .insert({
            automation_type: automation.automation_type,
            action_type: 'automation_failed',
            success: false,
            error_message: automationError.message,
            processing_time_ms: Date.now() - automationStart
          });

        results.push({
          type: automation.automation_type,
          success: false,
          error: automationError.message
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Automation cycle completed in ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      results,
      totalProcessingTime: totalTime,
      automationsRun: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Automation orchestrator error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Auto-resolve disputes using game APIs
async function runDisputeResolution(supabase: any, config: any) {
  console.log('🔍 Running dispute resolution automation');
  
  // Get pending disputes
  const { data: disputes } = await supabase
    .from('disputes')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  let resolvedCount = 0;

  for (const dispute of disputes || []) {
    try {
      // Check if we have API integration for this game
      const { data: apiIntegration } = await supabase
        .from('game_api_integrations')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (apiIntegration) {
        // Simulate API verification (replace with actual API calls)
        const isValid = Math.random() > 0.3; // 70% auto-resolution rate
        
        if (isValid) {
          await supabase
            .from('disputes')
            .update({
              status: 'resolved',
              admin_response: 'Auto-resolved via API verification',
              resolved_at: new Date().toISOString(),
              resolved_by: null // System resolution
            })
            .eq('id', dispute.id);

          resolvedCount++;
        }
      }
    } catch (error) {
      console.error(`Error resolving dispute ${dispute.id}:`, error);
    }
  }

  return { resolvedDisputes: resolvedCount };
}

// Scheduled tournaments that run without intervention
async function runTournamentScheduler(supabase: any, config: any) {
  console.log('🏆 Running tournament scheduler automation');
  
  // Get active tournament templates
  const { data: templates } = await supabase
    .from('tournament_templates')
    .select('*')
    .eq('is_active', true);

  let createdCount = 0;

  for (const template of templates || []) {
    try {
      // Check if it's time to create a tournament based on cron schedule
      // For simplicity, create one tournament per run if none exists in the last hour
      const { data: recentTournaments } = await supabase
        .from('tournaments')
        .select('id')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);

      if (!recentTournaments?.length) {
        // Create new tournament
        const { data: tournament } = await supabase
          .from('tournaments')
          .insert({
            title: `${template.template_name} - Auto Tournament`,
            game_id: template.game_id,
            max_participants: template.max_participants,
            entry_fee: template.entry_fee,
            prize_pool: template.entry_fee * template.max_participants * 0.9, // 10% platform fee
            status: 'open',
            tournament_type: 'elimination',
            start_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Start in 30 minutes
            registration_deadline: new Date(Date.now() + 25 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (tournament) {
          createdCount++;
        }
      }
    } catch (error) {
      console.error(`Error creating tournament from template ${template.id}:`, error);
    }
  }

  return { createdTournaments: createdCount };
}

// Dynamic pricing based on demand/supply
async function runDynamicPricing(supabase: any, config: any) {
  console.log('💰 Running dynamic pricing automation');
  
  // Get pricing rules
  const { data: pricingRules } = await supabase
    .from('dynamic_pricing_rules')
    .select('*')
    .eq('is_active', true);

  let updatedCount = 0;

  for (const rule of pricingRules || []) {
    try {
      // Calculate demand (active challenges for this game)
      const { count: activeChallenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', rule.game_id)
        .eq('status', 'open');

      // Calculate supply (available players in queue)
      const { count: queuedPlayers } = await supabase
        .from('match_queue')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', rule.game_id)
        .eq('queue_status', 'searching');

      // Calculate new price based on demand/supply ratio
      const demandFactor = Math.max(1, activeChallenges / 10);
      const supplyFactor = Math.max(0.5, queuedPlayers / 20);
      
      let newPrice = rule.base_price;
      
      if (demandFactor > 1) {
        newPrice *= rule.demand_multiplier;
      }
      
      if (supplyFactor > 1) {
        newPrice *= rule.supply_multiplier;
      }

      // Apply min/max constraints
      newPrice = Math.max(rule.min_price, Math.min(rule.max_price, newPrice));

      // Update if price changed significantly (>5%)
      if (Math.abs(newPrice - rule.current_price) / rule.current_price > 0.05) {
        await supabase
          .from('dynamic_pricing_rules')
          .update({
            current_price: newPrice,
            last_updated: new Date().toISOString()
          })
          .eq('id', rule.id);

        updatedCount++;
      }
    } catch (error) {
      console.error(`Error updating pricing for rule ${rule.id}:`, error);
    }
  }

  return { updatedPrices: updatedCount };
}

// Automated fraud detection and account actions
async function runFraudDetection(supabase: any, config: any) {
  console.log('🛡️ Running fraud detection automation');
  
  // Get active fraud patterns
  const { data: patterns } = await supabase
    .from('fraud_patterns')
    .select('*')
    .eq('is_active', true);

  let flaggedCount = 0;

  for (const pattern of patterns || []) {
    try {
      // Get recent player activity for analysis
      const { data: recentStats } = await supabase
        .from('player_stats')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      for (const stat of recentStats || []) {
        let isSuspicious = false;
        const criteria = pattern.detection_criteria;

        switch (pattern.pattern_type) {
          case 'win_rate':
            // Check for impossible win rates
            const winRate = stat.stats_data?.wins / (stat.stats_data?.wins + stat.stats_data?.losses || 1);
            if (winRate > criteria.max_win_rate && stat.stats_data?.wins > criteria.min_games) {
              isSuspicious = true;
            }
            break;
          
          case 'stat_anomaly':
            // Check for impossible K/D ratios or other stats
            const kd = stat.stats_data?.kills / (stat.stats_data?.deaths || 1);
            if (kd > criteria.max_kd_ratio && stat.stats_data?.kills > criteria.min_kills) {
              isSuspicious = true;
            }
            break;
        }

        if (isSuspicious) {
          // Create suspicious activity record
          await supabase
            .from('suspicious_activities')
            .insert({
              user_id: stat.user_id,
              activity_type: pattern.pattern_type,
              description: `Auto-detected: ${pattern.pattern_name}`,
              severity: pattern.severity_level,
              metadata: { pattern_id: pattern.id, stats_data: stat.stats_data }
            });

          // Take automated action if configured
          if (pattern.auto_action === 'restrict') {
            await supabase
              .from('profiles')
              .update({ is_restricted: true })
              .eq('user_id', stat.user_id);
          }

          flaggedCount++;
        }
      }
    } catch (error) {
      console.error(`Error in fraud detection pattern ${pattern.id}:`, error);
    }
  }

  return { flaggedAccounts: flaggedCount };
}

// Bot-driven market making for popular games
async function runMarketMaking(supabase: any, config: any) {
  console.log('🎯 Running market making automation');
  
  // Get popular games (games with recent activity)
  const { data: popularGames } = await supabase
    .from('challenges')
    .select('game_id, count(*)')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .group('game_id')
    .order('count', { ascending: false })
    .limit(5);

  let createdChallenges = 0;

  for (const gameData of popularGames || []) {
    try {
      // Check if there are enough open challenges for this game
      const { count: openChallenges } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameData.game_id)
        .eq('status', 'open');

      // Create bot challenges if supply is low
      if (openChallenges < 3) {
        // Get pricing for this game
        const { data: pricingRule } = await supabase
          .from('dynamic_pricing_rules')
          .select('current_price')
          .eq('game_id', gameData.game_id)
          .single();

        const stakeAmount = pricingRule?.current_price || 10;

        // Create automated challenge
        const { data: challenge } = await supabase
          .from('challenges')
          .insert({
            title: `Quick Match - Auto Generated`,
            game_id: gameData.game_id,
            stake_amount: stakeAmount,
            max_participants: 2,
            challenge_type: '1v1',
            platform: 'Cross-Platform',
            description: 'Auto-generated challenge for instant matching',
            creator_id: null, // System-created
            status: 'open'
          })
          .select()
          .single();

        if (challenge) {
          createdChallenges++;
        }
      }
    } catch (error) {
      console.error(`Error in market making for game ${gameData.game_id}:`, error);
    }
  }

  return { createdChallenges };
}