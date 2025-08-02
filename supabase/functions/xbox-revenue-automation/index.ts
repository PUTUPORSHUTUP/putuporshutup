import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()
    console.log(`Xbox Revenue Automation: ${action}`)

    let result = { success: true }

    switch (action) {
      case 'start_automation':
        // Update automation status
        await supabase
          .from('xbox_automation_status')
          .update({
            is_active: true,
            last_updated: new Date().toISOString(),
            revenue_today: 0,
            active_lobbies: 0,
            automation_config: {
              auto_lobby_creation: true,
              revenue_optimization: true,
              auto_match_processing: true,
              target_revenue_per_hour: 75,
              peak_hour_pricing: true
            }
          })
          .eq('xbox_console_id', 'xbox-series-x-main')

        // Log the automation start
        await supabase
          .from('automated_actions')
          .insert({
            automation_type: 'xbox_revenue',
            action_type: 'start_automation',
            success: true,
            action_data: { message: 'Xbox revenue automation started' }
          })

        result = { success: true, message: 'Xbox automation started successfully' }
        break

      case 'stop_automation':
        // Update automation status
        await supabase
          .from('xbox_automation_status')
          .update({
            is_active: false,
            last_updated: new Date().toISOString(),
            automation_config: {
              auto_lobby_creation: false,
              revenue_optimization: false,
              auto_match_processing: false,
              target_revenue_per_hour: 0,
              peak_hour_pricing: false
            }
          })
          .eq('xbox_console_id', 'xbox-series-x-main')

        // Log the automation stop
        await supabase
          .from('automated_actions')
          .insert({
            automation_type: 'xbox_revenue',
            action_type: 'stop_automation',
            success: true,
            action_data: { message: 'Xbox revenue automation stopped' }
          })

        result = { success: true, message: 'Xbox automation stopped successfully' }
        break

      case 'optimize_revenue':
        // Update pricing and optimization settings
        await supabase
          .from('dynamic_pricing_rules')
          .update({
            current_price: 15.00,
            demand_multiplier: 1.3,
            last_updated: new Date().toISOString()
          })
          .eq('is_active', true)

        // Log optimization
        await supabase
          .from('automated_actions')
          .insert({
            automation_type: 'revenue_optimization',
            action_type: 'optimize_pricing',
            success: true,
            action_data: { message: 'Revenue optimization completed' }
          })

        result = { success: true, message: 'Revenue optimization completed' }
        break

      case 'create_lobbies':
        // Simulate lobby creation
        const lobbyCount = Math.floor(Math.random() * 5) + 3 // 3-7 lobbies

        // Update active lobbies count
        await supabase
          .from('xbox_automation_status')
          .update({
            active_lobbies: lobbyCount,
            last_updated: new Date().toISOString()
          })
          .eq('xbox_console_id', 'xbox-series-x-main')

        // Log lobby creation
        await supabase
          .from('automated_actions')
          .insert({
            automation_type: 'lobby_creation',
            action_type: 'create_lobbies',
            success: true,
            action_data: { 
              message: `Created ${lobbyCount} automated lobbies`,
              total_lobbies: lobbyCount
            }
          })

        result = { success: true, total_lobbies: lobbyCount }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Xbox Revenue Automation error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})