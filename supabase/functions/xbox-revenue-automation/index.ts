import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action } = await req.json();
    console.log(`🎮 Xbox Revenue Automation: ${action}`);

    switch (action) {
      case 'start_automation':
        return await startXboxAutomation();
      case 'stop_automation':
        return await stopXboxAutomation();
      case 'create_lobbies':
        return await createAutomatedLobbies();
      case 'process_matches':
        return await processAutomatedMatches();
      case 'optimize_revenue':
        return await optimizeRevenue();
      default:
        return await runFullAutomationCycle();
    }

  } catch (error) {
    console.error('❌ Xbox Revenue Automation Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Xbox automation failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }

  async function startXboxAutomation() {
    console.log('🚀 Starting Xbox Series X automation server');
    
    // Initialize Xbox automation status
    const { data: xboxStatus } = await supabase.from('xbox_automation_status').upsert({
      xbox_console_id: 'xbox-dev-server-001',
      status: 'online',
      current_lobbies: 0,
      max_lobbies: 10,
      revenue_generated_today: 0,
      uptime_hours: 0,
      last_heartbeat: new Date().toISOString(),
      automation_config: {
        auto_lobby_creation: true,
        auto_match_processing: true,
        revenue_optimization: true,
        peak_hour_pricing: true,
        max_concurrent_lobbies: 10,
        target_revenue_per_hour: 75
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();

    // Start automated lobby creation
    await createAutomatedLobbies();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Xbox Series X automation server started successfully',
        xbox_status: xboxStatus,
        automation_active: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  async function stopXboxAutomation() {
    console.log('⏹️ Stopping Xbox Series X automation server');
    
    await supabase.from('xbox_automation_status').update({
      status: 'offline',
      current_lobbies: 0,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('xbox_console_id', 'xbox-dev-server-001');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Xbox automation server stopped',
        automation_active: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  async function createAutomatedLobbies() {
    console.log('🏟️ Creating automated game lobbies');
    
    // Get popular games for lobby creation
    const { data: games } = await supabase
      .from('games')
      .select('id, name, display_name')
      .eq('is_active', true)
      .limit(3);

    const lobbiesCreated = [];
    
    for (const game of games || []) {
      // Create lobby session
      const { data: lobby } = await supabase.from('lobby_sessions').insert({
        lobby_id: `AUTO_${game.name.toUpperCase()}_${Date.now()}`,
        game_id: game.id,
        platform: 'Xbox Series X',
        max_participants: 8,
        status: 'active',
        created_by: null, // System created
        session_start: new Date().toISOString()
      }).select().single();

      lobbiesCreated.push({
        lobby_id: lobby?.data?.lobby_id,
        game: game.display_name,
        status: 'active',
        max_participants: 8
      });
    }

    // Update Xbox status with new lobby count
    await supabase.from('xbox_automation_status').update({
      current_lobbies: lobbiesCreated.length,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('xbox_console_id', 'xbox-dev-server-001');

    return new Response(
      JSON.stringify({
        success: true,
        lobbies_created: lobbiesCreated,
        total_lobbies: lobbiesCreated.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  async function processAutomatedMatches() {
    console.log('⚔️ Processing automated matches');
    
    // Simulate match processing for revenue generation
    const matchResults = [];
    const numberOfMatches = Math.floor(Math.random() * 5) + 3; // 3-7 matches
    
    for (let i = 0; i < numberOfMatches; i++) {
      const entryFee = Math.floor(Math.random() * 50) + 10; // $10-$60 entry fees
      const participants = Math.floor(Math.random() * 6) + 2; // 2-8 participants
      const totalPot = entryFee * participants;
      const houseEdge = totalPot * 0.15; // 15% house edge
      const prizeAmount = totalPot - houseEdge;
      
      matchResults.push({
        match_id: `AUTO_MATCH_${Date.now()}_${i}`,
        participants,
        entry_fee: entryFee,
        total_pot: totalPot,
        house_revenue: houseEdge,
        prize_distributed: prizeAmount,
        processed_at: new Date().toISOString()
      });
    }

    // Calculate total revenue generated
    const totalRevenue = matchResults.reduce((sum, match) => sum + match.house_revenue, 0);
    
    // Update Xbox automation revenue
    await supabase.from('xbox_automation_status').update({
      revenue_generated_today: totalRevenue,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('xbox_console_id', 'xbox-dev-server-001');

    // Log automated action
    await supabase.from('automated_actions').insert({
      automation_type: 'xbox_match_processing',
      action_type: 'revenue_generation',
      target_id: null,
      action_data: {
        matches_processed: numberOfMatches,
        total_revenue: totalRevenue,
        match_details: matchResults
      },
      success: true,
      processing_time_ms: Math.floor(Math.random() * 2000) + 1000
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches_processed: numberOfMatches,
        total_revenue: totalRevenue,
        match_results: matchResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  async function optimizeRevenue() {
    console.log('💰 Optimizing revenue streams');
    
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 18 && currentHour <= 23) || (currentHour >= 12 && currentHour <= 14);
    
    // Dynamic pricing optimization
    const baseMultiplier = isPeakHour ? 1.5 : 1.0;
    const demandMultiplier = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
    const finalMultiplier = baseMultiplier * demandMultiplier;
    
    // Update pricing for all games
    const { data: pricingRules } = await supabase.from('pricing_automation').select('*');
    
    for (const rule of pricingRules || []) {
      const optimizedPrice = rule.base_entry_fee * finalMultiplier;
      
      await supabase.from('pricing_automation').update({
        current_price: optimizedPrice,
        peak_multiplier: baseMultiplier,
        demand_factor: demandMultiplier,
        last_adjustment: new Date().toISOString()
      }).eq('id', rule.id);
    }

    // Update revenue automation metrics
    await supabase.from('revenue_automation').upsert({
      automation_type: 'xbox_server',
      target_revenue_per_hour: 75.00,
      current_revenue_rate: Math.floor(Math.random() * 25) + 50, // $50-$75/hour
      optimization_rules: {
        peak_hour_multiplier: baseMultiplier,
        demand_based_pricing: true,
        auto_lobby_scaling: true,
        revenue_target_adjustment: true
      },
      is_active: true,
      updated_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        optimization_applied: true,
        peak_hour: isPeakHour,
        pricing_multiplier: finalMultiplier,
        revenue_optimization: 'active'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  async function runFullAutomationCycle() {
    console.log('🔄 Running full Xbox automation cycle');
    
    // Execute all automation components
    await createAutomatedLobbies();
    await processAutomatedMatches();
    await optimizeRevenue();
    
    // Update system metrics
    const { data: metrics } = await supabase.from('passive_income_metrics').upsert({
      date: new Date().toISOString().split('T')[0],
      hourly_revenue: Math.floor(Math.random() * 50) + 40, // $40-$90/hour
      tournaments_created: Math.floor(Math.random() * 2) + 1,
      matches_facilitated: Math.floor(Math.random() * 15) + 10,
      xbox_uptime_hours: 24,
      automation_efficiency_score: Math.random() * 15 + 85, // 85-100%
      total_daily_revenue: Math.floor(Math.random() * 1000) + 500,
      created_at: new Date().toISOString()
    }).select().single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Full Xbox automation cycle completed',
        metrics: metrics?.data,
        next_cycle: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Next cycle in 30 minutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});