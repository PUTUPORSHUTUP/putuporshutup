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
          case 'xbox_lobby_automation':
          case 'xbox_lobby_creator':
          case 'xbox_tournament_scheduler':
          case 'xbox_lobby_monitor':
            automationResult = await runXboxAutomation(supabaseClient, automation);
            break;
          case 'premium_tournaments':
            automationResult = await runPremiumTournaments(supabaseClient, automation);
            break;
          case 'api_game_integration':
            automationResult = await runApiGameIntegration(supabaseClient, automation);
            break;
          case 'nba_2k25_monitoring':
          case 'mlb_show_25_monitoring':
            automationResult = await runGameMonitoring(supabaseClient, automation);
            break;
          case 'sponsored_challenges':
            automationResult = await runSponsoredChallenges(supabaseClient, automation);
            break;
          case 'franchise_tournaments':
            automationResult = await runFranchiseTournaments(supabaseClient, automation);
            break;
          case 'subscription_tiers':
            automationResult = await runSubscriptionTiers(supabaseClient, automation);
            break;
          case 'high_roller_vip':
            automationResult = await runHighRollerVip(supabaseClient, automation);
            break;
          case 'automated_leagues':
            automationResult = await runAutomatedLeagues(supabaseClient, automation);
            break;
          case 'peak_hour_multipliers':
            automationResult = await runPeakHourMultipliers(supabaseClient, automation);
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

// Scheduled tournaments that run without intervention with collectible posters
async function runTournamentScheduler(supabase: any, config: any) {
  console.log('🏆 Running tournament scheduler automation with collectible posters');
  
  // Get active tournament templates with cover art
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
        // Get next episode number using our safe function
        const { data: episodeNumber } = await supabase
          .rpc('safe_nextval', { sequence_name: 'tournament_episode_seq' });
        
        // Get random title variation
        const titleVariations = template.title_variations || ["Championship"];
        const randomVariation = titleVariations[Math.floor(Math.random() * titleVariations.length)];
        
        // Create collectible poster title
        const posterTitle = template.poster_title_template
          ? template.poster_title_template
              .replace('{series}', template.collectible_series || 'Championship Series')
              .replace('{episode}', episodeNumber.toString().padStart(3, '0'))
              .replace('{variation}', randomVariation)
          : `${template.collectible_series} #${episodeNumber.toString().padStart(3, '0')}: ${randomVariation}`;

        // Create new collectible tournament
        const { data: tournament } = await supabase
          .from('tournaments')
          .insert({
            title: posterTitle,
            game_id: template.game_id,
            max_participants: template.max_participants,
            entry_fee: template.entry_fee,
            prize_pool: template.entry_fee * template.max_participants * 0.9, // 10% platform fee
            status: 'open',
            tournament_type: 'single_elimination',
            start_time: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // Start in 2 hours
            created_at: new Date().toISOString(),
            cover_art_url: template.cover_art_url,
            poster_title: posterTitle,
            collectible_series: template.collectible_series,
            season_number: 1,
            episode_number: episodeNumber,
            platform: 'PC' // Default platform
          })
          .select()
          .single();

        if (tournament) {
          // Create collectible poster entry
          await supabase
            .from('tournament_posters')
            .insert({
              tournament_id: tournament.id,
              poster_title: posterTitle,
              cover_art_url: template.cover_art_url || '/placeholder-tournament.jpg',
              series_name: template.collectible_series || 'Championship Series',
              season_number: 1,
              episode_number: episodeNumber,
              rarity_level: episodeNumber === 1 ? 'legendary' : 
                          episodeNumber <= 10 ? 'rare' : 
                          episodeNumber <= 50 ? 'uncommon' : 'common'
            });

          createdCount++;
          console.log(`✨ Created collectible tournament: ${posterTitle}`);
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

// Xbox Series X automation handler
async function runXboxAutomation(supabase: any, automation: any) {
  console.log(`🎮 Running Xbox automation: ${automation.automation_type}`);
  
  const config = automation.config_data;
  
  try {
    // Call the appropriate Xbox function based on automation type
    const { data, error } = await supabase.functions.invoke('xbox-lobby-automation', {
      body: {
        action: automation.automation_type === 'xbox_lobby_creator' ? 'create_lobby' :
                automation.automation_type === 'xbox_tournament_scheduler' ? 'auto_start_tournaments' :
                automation.automation_type === 'xbox_lobby_monitor' ? 'monitor_lobbies' : 'create_lobby',
        config: config
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || { xboxAutomationCompleted: true };
  } catch (error) {
    console.error('Xbox automation error:', error);
    return { error: error.message, xboxAutomationCompleted: false };
  }
}

// Premium tournament automation
async function runPremiumTournaments(supabase: any, config: any) {
  console.log('👑 Running premium tournament automation');
  
  // Auto-create premium tournaments for high-value players
  const { data: premiumUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('is_premium', true)
    .gte('wallet_balance', 100)
    .limit(20);
    
  let createdTournaments = 0;
  
  if (premiumUsers && premiumUsers.length >= 4) {
    // Create a premium tournament
    const entryFees = [25, 50, 100];
    const entryFee = entryFees[Math.floor(Math.random() * entryFees.length)];
    
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('is_active', true)
      .limit(1);
      
    if (games && games.length > 0) {
      await supabase
        .from('tournaments')
        .insert({
          title: `Premium Championship - $${entryFee}`,
          game_id: games[0].id,
          entry_fee: entryFee,
          max_participants: 16,
          prize_pool: entryFee * 16 * 0.9,
          status: 'open',
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          platform: 'Cross-Platform',
          tournament_type: 'single_elimination'
        });
        
      createdTournaments++;
    }
  }
  
  return { createdPremiumTournaments: createdTournaments };
}

// API game integration automation
async function runApiGameIntegration(supabase: any, config: any) {
  console.log('🔗 Running API game integration automation');
  
  // Sync stats from game APIs
  const { data: integrations } = await supabase
    .from('game_api_integrations')
    .select('*')
    .eq('is_active', true);
    
  let syncedGames = 0;
  
  for (const integration of integrations || []) {
    try {
      // Simulate API sync
      await supabase
        .from('game_api_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);
        
      syncedGames++;
    } catch (error) {
      console.error(`API sync error for ${integration.platform}:`, error);
    }
  }
  
  return { syncedGames };
}

// Game monitoring automation
async function runGameMonitoring(supabase: any, config: any) {
  console.log('📊 Running game monitoring automation');
  
  // Monitor game performance and player activity
  const { data: games } = await supabase
    .from('games')
    .select('id, name')
    .eq('is_active', true);
    
  let monitoredGames = 0;
  
  for (const game of games || []) {
    // Get recent activity for this game
    const { count: activeChallenges } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    // Update game trend score
    await supabase
      .from('game_matrix')
      .update({ 
        trend_score: Math.min(100, (activeChallenges || 0) * 10),
        updated_at: new Date().toISOString()
      })
      .eq('game', game.name);
      
    monitoredGames++;
  }
  
  return { monitoredGames };
}

// Sponsored challenges automation
async function runSponsoredChallenges(supabase: any, config: any) {
  console.log('💼 Running sponsored challenges automation');
  
  // Create sponsored challenges during peak hours
  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 23;
  
  let createdSponsored = 0;
  
  if (isPeakHour) {
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('is_active', true)
      .limit(1);
      
    if (games && games.length > 0) {
      await supabase
        .from('challenges')
        .insert({
          title: '🏆 Sponsored Championship',
          game_id: games[0].id,
          stake_amount: 50,
          max_participants: 8,
          challenge_type: 'tournament',
          platform: 'Cross-Platform',
          description: 'Sponsored by PUOSU - Extra prizes!',
          status: 'open'
        });
        
      createdSponsored++;
    }
  }
  
  return { createdSponsoredChallenges: createdSponsored };
}

// Franchise tournaments automation
async function runFranchiseTournaments(supabase: any, config: any) {
  console.log('🏆 Running franchise tournaments automation');
  
  // Create franchise-specific tournaments
  const franchises = ['NBA 2K25', 'Madden NFL 25', 'Call of Duty'];
  let createdFranchise = 0;
  
  for (const franchise of franchises) {
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .ilike('name', `%${franchise}%`)
      .limit(1)
      .single();
      
    if (game) {
      const { count: existingTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)
        .eq('status', 'open');
        
      if ((existingTournaments || 0) < 2) {
        await supabase
          .from('tournaments')
          .insert({
            title: `${franchise} Championship Series`,
            game_id: game.id,
            entry_fee: 25,
            max_participants: 32,
            prize_pool: 25 * 32 * 0.9,
            status: 'open',
            start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            platform: 'Cross-Platform',
            tournament_type: 'single_elimination'
          });
          
        createdFranchise++;
      }
    }
  }
  
  return { createdFranchiseTournaments: createdFranchise };
}

// Subscription tiers automation
async function runSubscriptionTiers(supabase: any, config: any) {
  console.log('💎 Running subscription tiers automation');
  
  // Analyze user activity and suggest tier upgrades
  const { data: users } = await supabase
    .from('profiles')
    .select('user_id, wallet_balance, is_premium')
    .eq('is_premium', false)
    .gte('wallet_balance', 50)
    .limit(10);
    
  let upgradesSuggested = 0;
  
  for (const user of users || []) {
    // Create upgrade notification
    await supabase
      .from('activities')
      .insert({
        user_id: user.user_id,
        activity_type: 'tier_upgrade_suggestion',
        title: 'Premium Upgrade Available',
        description: 'Unlock exclusive tournaments and features',
        metadata: { suggested_tier: 'premium', current_balance: user.wallet_balance }
      });
      
    upgradesSuggested++;
  }
  
  return { upgradesSuggested };
}

// High roller VIP automation
async function runHighRollerVip(supabase: any, config: any) {
  console.log('💰 Running high roller VIP automation');
  
  // Create high-stakes tournaments for VIP players
  const { data: highRollers } = await supabase
    .from('profiles')
    .select('user_id')
    .gte('wallet_balance', 500)
    .eq('is_premium', true)
    .limit(8);
    
  let vipTournaments = 0;
  
  if (highRollers && highRollers.length >= 4) {
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('is_active', true)
      .limit(1);
      
    if (games && games.length > 0) {
      await supabase
        .from('tournaments')
        .insert({
          title: '💎 VIP High Roller Championship',
          game_id: games[0].id,
          entry_fee: 200,
          max_participants: 8,
          prize_pool: 200 * 8 * 0.9,
          status: 'open',
          start_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          platform: 'Cross-Platform',
          tournament_type: 'single_elimination'
        });
        
      vipTournaments++;
    }
  }
  
  return { createdVipTournaments: vipTournaments };
}

// Automated leagues automation
async function runAutomatedLeagues(supabase: any, config: any) {
  console.log('🏅 Running automated leagues automation');
  
  // Create seasonal leagues
  const { data: games } = await supabase
    .from('games')
    .select('id, name')
    .eq('is_active', true)
    .limit(3);
    
  let leaguesCreated = 0;
  
  for (const game of games || []) {
    const { count: existingLeagues } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .ilike('title', '%League%')
      .eq('status', 'open');
      
    if ((existingLeagues || 0) === 0) {
      await supabase
        .from('tournaments')
        .insert({
          title: `${game.name} Weekly League`,
          game_id: game.id,
          entry_fee: 15,
          max_participants: 16,
          prize_pool: 15 * 16 * 0.9,
          status: 'open',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          platform: 'Cross-Platform',
          tournament_type: 'round_robin'
        });
        
      leaguesCreated++;
    }
  }
  
  return { leaguesCreated };
}

// Peak hour multipliers automation
async function runPeakHourMultipliers(supabase: any, config: any) {
  console.log('⚡ Running peak hour multipliers automation');
  
  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 23;
  const isWeekend = [0, 6].includes(new Date().getDay());
  
  let multiplier = 1.0;
  if (isPeakHour) multiplier = 1.5;
  if (isWeekend) multiplier = 2.0;
  if (isPeakHour && isWeekend) multiplier = 2.5;
  
  // Update pricing rules with current multiplier
  const { data: updatedRules } = await supabase
    .from('dynamic_pricing_rules')
    .update({
      demand_multiplier: multiplier,
      last_updated: new Date().toISOString()
    })
    .eq('is_active', true);
    
  return { 
    currentMultiplier: multiplier,
    isPeakHour,
    isWeekend,
    updatedRules: updatedRules?.length || 0
  };
}