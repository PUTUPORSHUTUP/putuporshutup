import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthMetrics {
  timestamp: string;
  market_engine: {
    success_rate: number;
    avg_duration_ms: number;
    total_cycles_24h: number;
  };
  player_pool: {
    total_test_users: number;
    active_balance_users: number;
    avg_balance: number;
  };
  financial_integrity: {
    successful_payouts_24h: number;
    total_payout_amount_24h: number;
  };
  system_status: 'healthy' | 'warning' | 'critical';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    console.log('🔍 Platform Health Monitor - Starting health check')
    const startTime = Date.now()

    // Get comprehensive platform health report
    const { data: healthReport, error: healthError } = await supabaseClient
      .rpc('get_platform_health')

    if (healthError) {
      console.error('❌ Health check failed:', healthError)
      throw healthError
    }

    console.log('✅ Health report generated:', healthReport)

    // Check for critical alerts
    const { data: criticalAlerts, error: alertsError } = await supabaseClient
      .from('system_alerts')
      .select('*')
      .eq('resolved', false)
      .eq('severity', 'critical')
      .limit(10)

    if (alertsError) {
      console.warn('⚠️ Could not fetch alerts:', alertsError)
    }

    // Generate automatic alerts based on health metrics
    const health = healthReport as HealthMetrics
    const alerts: string[] = []

    // Alert on low success rate
    if (health.market_engine.success_rate < 90) {
      const alertId = await generateAlert(supabaseClient, 
        'low_success_rate',
        'critical',
        `Market engine success rate dropped to ${health.market_engine.success_rate}%`,
        { success_rate: health.market_engine.success_rate }
      )
      alerts.push(`Generated critical alert: ${alertId}`)
    }

    // Alert on insufficient test users
    if (health.player_pool.active_balance_users < 10) {
      const alertId = await generateAlert(supabaseClient,
        'insufficient_players',
        'high',
        `Only ${health.player_pool.active_balance_users} active test users available`,
        { active_users: health.player_pool.active_balance_users }
      )
      alerts.push(`Generated high alert: ${alertId}`)
    }

    // Alert on high execution times
    if (health.market_engine.avg_duration_ms > 20000) {
      const alertId = await generateAlert(supabaseClient,
        'high_latency',
        'medium',
        `Average execution time: ${health.market_engine.avg_duration_ms}ms`,
        { avg_duration_ms: health.market_engine.avg_duration_ms }
      )
      alerts.push(`Generated medium alert: ${alertId}`)
    }

    const duration = Date.now() - startTime
    console.log(`🎉 Platform Health Monitor completed in ${duration}ms`)

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      execution_time_ms: duration,
      platform_health: health,
      critical_alerts: criticalAlerts || [],
      alerts_generated: alerts,
      recommendations: generateRecommendations(health),
      next_check_in: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    }

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('💥 Platform Health Monitor failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Helper function to generate system alerts
async function generateAlert(
  supabase: any,
  alertType: string,
  severity: string,
  message: string,
  metadata: any
): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('generate_system_alert', {
        p_alert_type: alertType,
        p_severity: severity,
        p_message: message,
        p_metadata: metadata
      })

    if (error) {
      console.error('Failed to generate alert:', error)
      return 'alert_generation_failed'
    }

    console.log(`🚨 Generated ${severity} alert: ${alertType}`)
    return data
  } catch (error) {
    console.error('Alert generation error:', error)
    return 'alert_generation_error'
  }
}

// Generate actionable recommendations based on health metrics
function generateRecommendations(health: HealthMetrics): string[] {
  const recommendations: string[] = []

  if (health.system_status === 'critical') {
    recommendations.push('🔥 CRITICAL: Add more test users immediately')
    recommendations.push('🔥 CRITICAL: Review market engine logs for failures')
  }

  if (health.market_engine.success_rate < 95) {
    recommendations.push('⚠️ Investigate recent market engine failures')
    recommendations.push('⚠️ Consider adding circuit breaker patterns')
  }

  if (health.player_pool.active_balance_users < 20) {
    recommendations.push('💰 Auto-scaling will trigger to add test users')
    recommendations.push('💰 Consider increasing test user wallet balances')
  }

  if (health.market_engine.avg_duration_ms > 15000) {
    recommendations.push('🐌 Optimize database queries for better performance')
    recommendations.push('🐌 Consider adding database indexing')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ System is running optimally')
    recommendations.push('✅ All metrics within healthy thresholds')
  }

  return recommendations
}

/* Deno.cron example for automated monitoring (commented out for now)
Deno.cron("Platform health check", "*/5 * * * *", () => {
  console.log("⏰ Automated health check triggered");
  // This would trigger the health monitor every 5 minutes
});
*/