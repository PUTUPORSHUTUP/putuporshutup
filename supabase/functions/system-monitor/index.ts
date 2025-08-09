import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertConfig {
  error_rate_threshold: number;
  payout_deviation_threshold: number;
  notification_email: string;
  notification_phone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current metrics
    const { data: kpis } = await supabase.rpc('admin_kpis_last24');
    
    if (!kpis) {
      throw new Error('Unable to fetch system KPIs');
    }

    // Calculate error rate for last 5 minutes
    const { data: recentEvents } = await supabase
      .from('market_events')
      .select('error_message')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const errorRate5m = recentEvents ? 
      (recentEvents.filter(e => e.error_message !== null).length / Math.max(recentEvents.length, 1)) * 100 : 0;

    // Get historical payout data for deviation calculation
    const { data: historicalPayouts } = await supabase
      .from('admin_metrics_daily')
      .select('payouts_cents')
      .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('day', { ascending: false })
      .limit(30);

    // Calculate standard deviation
    const payoutAmounts = historicalPayouts?.map(p => p.payouts_cents) || [];
    const mean = payoutAmounts.reduce((a, b) => a + b, 0) / Math.max(payoutAmounts.length, 1);
    const variance = payoutAmounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(payoutAmounts.length, 1);
    const stdDev = Math.sqrt(variance);
    
    const currentPayouts = kpis.payouts_cents;
    const deviationFromMean = Math.abs(currentPayouts - mean);
    const standardDeviations = stdDev > 0 ? deviationFromMean / stdDev : 0;

    // Load alert configuration
    const { data: alertConfig } = await supabase
      .from('api_configurations')
      .select('config_key, config_value')
      .in('config_key', [
        'alert_error_rate_threshold',
        'alert_payout_deviation_threshold', 
        'alert_notification_email',
        'alert_notification_phone'
      ]);

    const config: AlertConfig = {
      error_rate_threshold: 5, // Default 5%
      payout_deviation_threshold: 2, // Default 2σ
      notification_email: 'admin@putuporshutup.com',
      notification_phone: undefined,
    };

    alertConfig?.forEach(item => {
      switch (item.config_key) {
        case 'alert_error_rate_threshold':
          config.error_rate_threshold = parseFloat(item.config_value);
          break;
        case 'alert_payout_deviation_threshold':
          config.payout_deviation_threshold = parseFloat(item.config_value);
          break;
        case 'alert_notification_email':
          config.notification_email = item.config_value;
          break;
        case 'alert_notification_phone':
          config.notification_phone = item.config_value;
          break;
      }
    });

    const alerts = [];

    // Check error rate threshold
    if (errorRate5m > config.error_rate_threshold) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate is ${errorRate5m.toFixed(1)}% (threshold: ${config.error_rate_threshold}%)`,
        severity: 'HIGH',
        value: errorRate5m,
        threshold: config.error_rate_threshold,
      });
    }

    // Check payout deviation threshold
    if (standardDeviations > config.payout_deviation_threshold) {
      alerts.push({
        type: 'PAYOUT_DEVIATION',
        message: `Payouts deviate ${standardDeviations.toFixed(1)}σ from mean (threshold: ${config.payout_deviation_threshold}σ)`,
        severity: 'MEDIUM',
        value: standardDeviations,
        threshold: config.payout_deviation_threshold,
      });
    }

    // Send notifications if alerts exist
    if (alerts.length > 0) {
      console.log('Sending alerts:', alerts);
      
      // Log alerts to database
      for (const alert of alerts) {
        await supabase
          .from('system_alerts')
          .insert({
            alert_type: alert.type,
            message: alert.message,
            severity: alert.severity,
            metric_value: alert.value,
            threshold_value: alert.threshold,
            resolved: false,
          });
      }

      // Send email notification (placeholder - would integrate with email service)
      if (config.notification_email) {
        console.log(`Would send email to: ${config.notification_email}`);
        console.log('Alert details:', alerts.map(a => a.message).join('\n'));
      }

      // Send SMS notification (placeholder - would integrate with SMS service)
      if (config.notification_phone) {
        console.log(`Would send SMS to: ${config.notification_phone}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          error_rate_5m: errorRate5m,
          payout_deviation_sigma: standardDeviations,
          current_payouts_cents: currentPayouts,
          historical_mean_cents: mean,
        },
        alerts: alerts,
        config: config,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('System monitor error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});