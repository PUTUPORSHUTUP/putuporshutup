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

    console.log('🔧 Setting up automation configurations');

    // Default automation configurations
    const automationConfigs = [
      {
        automation_type: 'dispute_resolution',
        is_enabled: true,
        config_data: {
          max_disputes_per_run: 10,
          auto_resolve_threshold: 0.7,
          api_timeout_seconds: 30
        },
        run_frequency_minutes: 15,
        next_run_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      {
        automation_type: 'tournament_scheduler',
        is_enabled: true,
        config_data: {
          default_entry_fee: 10.00,
          max_participants: 16,
          start_delay_minutes: 30
        },
        run_frequency_minutes: 60,
        next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      },
      {
        automation_type: 'dynamic_pricing',
        is_enabled: true,
        config_data: {
          price_update_threshold: 0.05,
          max_price_change: 0.5,
          min_activity_threshold: 5
        },
        run_frequency_minutes: 30,
        next_run_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      },
      {
        automation_type: 'fraud_detection',
        is_enabled: true,
        config_data: {
          analysis_window_hours: 24,
          max_accounts_per_run: 50,
          confidence_threshold: 0.8
        },
        run_frequency_minutes: 60,
        next_run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      },
      {
        automation_type: 'market_making',
        is_enabled: true,
        config_data: {
          min_open_challenges: 3,
          max_challenges_per_game: 5,
          stake_range: { min: 5, max: 50 }
        },
        run_frequency_minutes: 45,
        next_run_at: new Date(Date.now() + 45 * 60 * 1000).toISOString()
      }
    ];

    // Insert or update automation configs
    for (const config of automationConfigs) {
      const { error } = await supabaseClient
        .from('automation_config')
        .upsert(config, { 
          onConflict: 'automation_type',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error setting up ${config.automation_type}:`, error);
      } else {
        console.log(`✅ Set up ${config.automation_type} automation`);
      }
    }

    // Set up default fraud detection patterns
    const fraudPatterns = [
      {
        pattern_name: 'Impossible Win Rate',
        pattern_type: 'win_rate',
        detection_criteria: {
          max_win_rate: 0.95,
          min_games: 10
        },
        severity_level: 'high',
        auto_action: 'flag'
      },
      {
        pattern_name: 'Extreme K/D Ratio',
        pattern_type: 'stat_anomaly',
        detection_criteria: {
          max_kd_ratio: 20,
          min_kills: 15
        },
        severity_level: 'high',
        auto_action: 'flag'
      },
      {
        pattern_name: 'Suspicious Betting Pattern',
        pattern_type: 'betting_pattern',
        detection_criteria: {
          max_bet_increase: 10,
          pattern_window_hours: 6
        },
        severity_level: 'medium',
        auto_action: 'review'
      }
    ];

    for (const pattern of fraudPatterns) {
      const { error } = await supabaseClient
        .from('fraud_patterns')
        .upsert(pattern, { 
          onConflict: 'pattern_name',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error setting up fraud pattern ${pattern.pattern_name}:`, error);
      }
    }

    // Set up default tournament templates
    const { data: games } = await supabaseClient
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .limit(3);

    if (games && games.length > 0) {
      const tournamentTemplates = games.map(game => ({
        template_name: `Daily ${game.name} Tournament`,
        game_id: game.id,
        schedule_cron: '0 18 * * *', // Daily at 6 PM
        max_participants: 16,
        entry_fee: 15.00,
        prize_distribution: {
          '1st': 0.5,
          '2nd': 0.3,
          '3rd': 0.15,
          '4th': 0.05
        }
      }));

      for (const template of tournamentTemplates) {
        const { error } = await supabaseClient
          .from('tournament_templates')
          .upsert(template, { 
            onConflict: 'template_name',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Error setting up tournament template:`, error);
        }
      }
    }

    // Set up dynamic pricing rules for popular games
    if (games && games.length > 0) {
      const pricingRules = games.map(game => ({
        game_id: game.id,
        base_price: 10.00,
        demand_multiplier: 1.3,
        supply_multiplier: 0.8,
        min_price: 5.00,
        max_price: 50.00,
        current_price: 10.00
      }));

      for (const rule of pricingRules) {
        const { error } = await supabaseClient
          .from('dynamic_pricing_rules')
          .upsert(rule, { 
            onConflict: 'game_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Error setting up pricing rule:`, error);
        }
      }
    }

    console.log('✅ Automation setup completed');

    return new Response(JSON.stringify({
      success: true,
      message: 'Automation systems configured successfully',
      automations_configured: automationConfigs.length,
      fraud_patterns_created: fraudPatterns.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Setup automation error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});