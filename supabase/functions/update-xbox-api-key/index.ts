import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated and has admin privileges
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test the new API key before saving it
    const testResponse = await fetch(`https://xboxapi.com/v2/gamertag/TestGamertag123456789`, {
      headers: {
        'X-AUTH': apiKey.trim()
      }
    });

    if (!testResponse.ok && testResponse.status !== 404) {
      // 404 is expected for test gamertag, other errors indicate invalid key
      return new Response(
        JSON.stringify({ error: 'Invalid Xbox API key - unable to authenticate with Xbox API' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Here we would update the Supabase secret, but since we can't do that directly from edge functions,
    // we'll store it in a secure table and use it from there, or instruct the user to update it manually
    
    // Log the update attempt
    await supabase
      .from('automated_actions')
      .insert({
        action_type: 'xbox_api_key_update',
        target_id: user.id,
        details: {
          updated_by: user.id,
          timestamp: new Date().toISOString(),
          api_key_validated: true
        },
        status: 'completed'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Xbox API key validated successfully. Please update the XBOX_API_KEY secret in your Supabase project settings.',
        note: 'This function validates the key but cannot directly update Supabase secrets. Please copy the key to your project settings.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error updating Xbox API key:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});