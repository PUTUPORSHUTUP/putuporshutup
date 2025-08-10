import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, settings } = await req.json();
    console.log(`🚀 LAUNCH CONTROL: ${action}`);

    switch (action) {
      case 'enable_soft_launch':
        console.log('📍 Enabling soft launch mode...');
        await supabase
          .from('app_settings')
          .update({ value: 'true' })
          .eq('key', 'soft_launch');
        
        if (settings?.max_users) {
          await supabase
            .from('app_settings')
            .update({ value: settings.max_users.toString() })
            .eq('key', 'max_users');
        }
        
        if (settings?.phase) {
          await supabase
            .from('app_settings')
            .update({ value: settings.phase.toString() })
            .eq('key', 'launch_phase');
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Soft launch enabled - Phase ${settings?.phase || 1}, Max users: ${settings?.max_users || 50}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'scale_up':
        console.log('📈 Scaling up launch...');
        const { phase = 2, max_users = 200 } = settings || {};
        
        await supabase
          .from('app_settings')
          .update({ value: phase.toString() })
          .eq('key', 'launch_phase');
          
        await supabase
          .from('app_settings')
          .update({ value: max_users.toString() })
          .eq('key', 'max_users');
          
        await supabase
          .from('app_settings')
          .update({ value: 'false' })
          .eq('key', 'invite_only');
        
        return new Response(JSON.stringify({
          success: true,
          message: `Scaled to Phase ${phase} - Max users: ${max_users}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'get_status':
        console.log('📊 Getting launch status...');
        const { data: settings_data } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['soft_launch', 'max_users', 'launch_phase', 'invite_only', 'emergency_mode']);
        
        // Get current metrics
        const { data: active_users } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('last_used', new Date(Date.now() - 60 * 60 * 1000).toISOString());
        
        const { data: open_challenges } = await supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open');
        
        const status = settings_data?.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as any) || {};
        
        return new Response(JSON.stringify({
          success: true,
          status: {
            ...status,
            active_users: active_users?.length || 0,
            open_challenges: open_challenges?.length || 0,
            timestamp: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'emergency_stop':
        console.log('🛑 EMERGENCY STOP INITIATED');
        await supabase
          .from('app_settings')
          .update({ value: 'true' })
          .eq('key', 'emergency_mode');
          
        await supabase
          .from('app_settings')
          .update({ value: 'false' })
          .eq('key', 'soft_launch');
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Emergency stop activated - all systems halted'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Unknown action'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Launch control error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});