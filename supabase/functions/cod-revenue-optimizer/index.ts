import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CODRevenueConfig {
  target_hourly_revenue: number;
  premium_entry_fee: number;
  max_lobbies_per_hour: number;
  auto_create_lobbies: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = 'optimize_revenue' } = await req.json().catch(() => ({}));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💰 COD REVENUE OPTIMIZER - Starting optimization cycle...');

    switch (action) {
      case 'optimize_revenue':
        return await optimizeCODRevenue(supabase);
      case 'create_premium_lobby':
        return await createPremiumLobby(supabase);
      case 'analyze_performance':
        return await analyzeRevenuePerformance(supabase);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ COD Revenue Optimizer failed:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function optimizeCODRevenue(supabase: any) {
  console.log('🎯 Optimizing COD revenue streams...');
  
  const startTime = Date.now();
  let totalRevenue = 0;
  let lobbiesCreated = 0;
  let playersMatched = 0;

  // Step 1: Check current revenue performance
  const { data: currentMetrics } = await supabase
    .from('passive_income_metrics')
    .select('hourly_revenue')
    .eq('date', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentHourlyRevenue = currentMetrics?.hourly_revenue || 0;
  const targetHourlyRevenue = 150; // $150/hour target for COD

  console.log(`💰 Current hourly revenue: $${currentHourlyRevenue}, Target: $${targetHourlyRevenue}`);

  // Step 2: Create multiple COD revenue engines if below target
  if (currentHourlyRevenue < targetHourlyRevenue) {
    const lobbiesNeeded = Math.ceil((targetHourlyRevenue - currentHourlyRevenue) / 25); // $25 avg per lobby
    
    for (let i = 0; i < Math.min(lobbiesNeeded, 5); i++) { // Max 5 lobbies per cycle
      try {
        // Run COD market engine
        const { data: engineResult, error } = await supabase.functions.invoke('database-market-engine', {
          body: {
            auto_seed: true,
            mode_key: 'COD6:KILL_RACE'
          }
        });

        if (!error && engineResult?.success) {
          lobbiesCreated++;
          playersMatched += engineResult.challenge?.participantCount || 0;
          totalRevenue += engineResult.challenge?.totalPot * 0.15 || 0; // 15% platform fee
          
          console.log(`✅ COD Engine ${i + 1}: ${engineResult.challenge?.participantCount} players, $${engineResult.challenge?.totalPot} pot`);
        }
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`⚠️ Engine ${i + 1} failed:`, error.message);
      }
    }
  }

  // Step 3: Create premium lobbies for high-value players
  try {
    const premiumLobby = await createPremiumLobby(supabase);
    if (premiumLobby.success) {
      lobbiesCreated++;
      totalRevenue += 50; // Estimated premium lobby revenue
    }
  } catch (error) {
    console.log('⚠️ Premium lobby creation failed:', error.message);
  }

  // Step 4: Update revenue metrics
  await supabase.from('passive_income_metrics').upsert({
    date: new Date().toISOString().split('T')[0],
    hourly_revenue: currentHourlyRevenue + totalRevenue,
    total_daily_revenue: currentHourlyRevenue * new Date().getHours() + totalRevenue,
    automation_type: 'cod_revenue_optimizer',
    metadata: {
      lobbies_created: lobbiesCreated,
      players_matched: playersMatched,
      optimization_cycle: true
    }
  });

  // Step 5: Log revenue optimization action
  await supabase.from('automated_actions').insert({
    automation_type: 'cod_revenue_optimization',
    action_type: 'revenue_cycle',
    success: true,
    processing_time_ms: Date.now() - startTime,
    action_data: {
      lobbies_created: lobbiesCreated,
      players_matched: playersMatched,
      revenue_generated: totalRevenue,
      target_revenue: targetHourlyRevenue,
      current_revenue: currentHourlyRevenue + totalRevenue
    }
  });

  const duration = Date.now() - startTime;
  console.log(`🎯 COD Revenue optimization complete: $${totalRevenue} in ${duration}ms`);

  return new Response(JSON.stringify({
    success: true,
    revenue_optimization: {
      lobbies_created: lobbiesCreated,
      players_matched: playersMatched,
      revenue_generated: totalRevenue,
      duration_ms: duration,
      target_met: (currentHourlyRevenue + totalRevenue) >= targetHourlyRevenue,
      hourly_rate: currentHourlyRevenue + totalRevenue
    },
    message: `Generated $${totalRevenue.toFixed(2)} from ${lobbiesCreated} COD lobbies`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createPremiumLobby(supabase: any) {
  console.log('💎 Creating premium COD lobby...');

  // Get available premium players (VIP or high balance users)
  const { data: premiumPlayers, error: playersError } = await supabase
    .from('profiles')
    .select('user_id, username, wallet_balance, is_vip')
    .or('is_vip.eq.true,wallet_balance.gte.100')
    .gte('wallet_balance', 50.0)
    .limit(8);

  if (playersError || !premiumPlayers?.length) {
    throw new Error('No premium players available');
  }

  // Create high-stakes challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({
      title: 'Premium COD Kill Race - $50 Entry',
      description: 'High-stakes Call of Duty challenge for premium players',
      game_id: (await supabase.from('games').select('id').eq('name', 'Call of Duty').single()).data?.id,
      platform: 'xbox',
      stake_amount: 50,
      max_participants: 8,
      creator_id: premiumPlayers[0].user_id,
      challenge_type: 'top3',
      status: 'open',
      verification_method: 'api'
    })
    .select()
    .single();

  if (challengeError) {
    throw new Error(`Failed to create premium challenge: ${challengeError.message}`);
  }

  // Add premium players to challenge
  let participantCount = 0;
  for (const player of premiumPlayers.slice(0, 6)) {
    try {
      const { error } = await supabase.rpc('join_challenge_atomic', {
        p_challenge_id: challenge.id,
        p_user_id: player.user_id,
        p_stake_amount: 50
      });
      
      if (!error) {
        participantCount++;
      }
    } catch (error) {
      console.log(`⚠️ Failed to add premium player: ${error.message}`);
    }
  }

  if (participantCount >= 4) {
    // Activate challenge
    await supabase
      .from('challenges')
      .update({ 
        status: 'active',
        total_pot: participantCount * 50,
        start_time: new Date().toISOString()
      })
      .eq('id', challenge.id);

    console.log(`💎 Premium lobby created: ${participantCount} players, $${participantCount * 50} pot`);
    
    return {
      success: true,
      challenge_id: challenge.id,
      participants: participantCount,
      total_pot: participantCount * 50,
      estimated_revenue: (participantCount * 50) * 0.20 // 20% fee for premium
    };
  }

  throw new Error('Insufficient premium players joined');
}

async function analyzeRevenuePerformance(supabase: any) {
  console.log('📊 Analyzing COD revenue performance...');

  // Get revenue data for the last 24 hours
  const { data: revenueData } = await supabase
    .from('passive_income_metrics')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .eq('automation_type', 'cod_revenue_optimizer')
    .order('created_at', { ascending: false });

  // Get challenge completion rates
  const { data: challengeData } = await supabase
    .from('challenges')
    .select('total_pot, status, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .like('title', '%COD%');

  const totalRevenue24h = revenueData?.reduce((sum, metric) => sum + (metric.hourly_revenue || 0), 0) || 0;
  const completedChallenges = challengeData?.filter(c => c.status === 'completed').length || 0;
  const totalChallenges = challengeData?.length || 0;
  const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

  return new Response(JSON.stringify({
    success: true,
    performance_analysis: {
      revenue_24h: totalRevenue24h,
      hourly_average: totalRevenue24h / 24,
      completion_rate: completionRate,
      total_challenges: totalChallenges,
      completed_challenges: completedChallenges,
      efficiency_score: Math.min((totalRevenue24h / 1000) * 100, 100), // Target $1000/day
      recommendations: generateRevenueRecommendations(totalRevenue24h, completionRate)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function generateRevenueRecommendations(revenue24h: number, completionRate: number): string[] {
  const recommendations = [];
  
  if (revenue24h < 500) {
    recommendations.push('🚀 Increase lobby creation frequency');
    recommendations.push('💰 Consider higher entry fees for premium lobbies');
  }
  
  if (completionRate < 80) {
    recommendations.push('⚡ Improve match completion automation');
    recommendations.push('🎯 Add incentives for match completion');
  }
  
  if (revenue24h > 800) {
    recommendations.push('🏆 Revenue target exceeded! Scale up operations');
    recommendations.push('💎 Launch VIP exclusive lobbies');
  }
  
  return recommendations.length > 0 ? recommendations : ['✅ Performance optimal, maintain current strategy'];
}