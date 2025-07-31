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

    console.log('Starting automation scheduler...')

    // Define automation schedule (every 5 minutes for game tracking)
    const automations = [
      {
        name: 'live-game-tracker',
        interval_minutes: 5,
        description: 'Track Xbox Live game activity'
      },
      {
        name: 'automation-orchestrator', 
        interval_minutes: 15,
        description: 'Process general automations'
      },
      {
        name: 'game-automation-orchestrator',
        interval_minutes: 10, 
        description: 'Handle game-specific automations'
      }
    ]

    const results = []

    // Check and run automations that are due
    for (const automation of automations) {
      try {
        // Check when this automation last ran
        const { data: config } = await supabase
          .from('automation_config')
          .select('*')
          .eq('automation_type', automation.name)
          .single()

        const now = new Date()
        let shouldRun = false

        if (!config) {
          // First time running this automation
          shouldRun = true
          await supabase
            .from('automation_config')
            .insert({
              automation_type: automation.name,
              is_enabled: true,
              run_frequency_minutes: automation.interval_minutes,
              config_data: { description: automation.description },
              next_run_at: new Date(now.getTime() + automation.interval_minutes * 60000).toISOString()
            })
        } else if (config.is_enabled) {
          // Check if it's time to run
          const nextRun = new Date(config.next_run_at || 0)
          shouldRun = now >= nextRun
        }

        if (shouldRun) {
          console.log(`Running automation: ${automation.name}`)
          
          // Invoke the automation function
          const { data, error } = await supabase.functions.invoke(automation.name)
          
          if (error) {
            console.error(`Error running ${automation.name}:`, error)
            results.push({
              automation: automation.name,
              success: false,
              error: error.message
            })
          } else {
            console.log(`Successfully ran ${automation.name}`)
            results.push({
              automation: automation.name,
              success: true,
              data: data
            })
          }

          // Update the automation config with next run time
          const nextRunTime = new Date(now.getTime() + automation.interval_minutes * 60000)
          await supabase
            .from('automation_config')
            .update({
              last_run_at: now.toISOString(),
              next_run_at: nextRunTime.toISOString()
            })
            .eq('automation_type', automation.name)

        } else {
          console.log(`Skipping ${automation.name} - not due yet`)
          results.push({
            automation: automation.name,
            success: true,
            skipped: true,
            reason: 'Not due yet'
          })
        }

      } catch (error) {
        console.error(`Error processing automation ${automation.name}:`, error)
        results.push({
          automation: automation.name,
          success: false,
          error: error.message
        })
      }
    }

    console.log('Automation scheduler completed:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Automation scheduler error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})