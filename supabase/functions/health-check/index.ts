import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const startTime = Date.now()
    const checks = {
      database: false,
      market_engine: false,
      player_pool: false,
      timestamp: new Date().toISOString()
    }

    // Database connectivity check
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .limit(1)
      
      checks.database = !error && !!data
    } catch (e) {
      console.warn('Database check failed:', e)
      checks.database = false
    }

    // Market engine health check
    try {
      const { data, error } = await supabaseClient
        .from('market_events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
      
      checks.market_engine = !error
    } catch (e) {
      console.warn('Market engine check failed:', e)
      checks.market_engine = false
    }

    // Player pool check
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('is_test_user', true)
        .gte('wallet_balance', 100)
        .limit(1)
      
      checks.player_pool = !error && (data?.length ?? 0) > 0
    } catch (e) {
      console.warn('Player pool check failed:', e)
      checks.player_pool = false
    }

    const duration = Date.now() - startTime
    const allHealthy = Object.values(checks).filter(v => typeof v === 'boolean').every(Boolean)
    
    const response = {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      response_time_ms: duration,
      version: '1.0.0'
    }

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: allHealthy ? 200 : 503,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    )

  } catch (error) {
    console.error('Health check failed:', error)
    
    return new Response(
      JSON.stringify({ 
        status: 'down',
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