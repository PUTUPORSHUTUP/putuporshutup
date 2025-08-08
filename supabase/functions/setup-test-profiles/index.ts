import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    // Get existing test accounts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, wallet_balance')
      .eq('is_test_account', true);

    if (profilesError) {
      throw new Error(`Failed to get profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} test profiles`);

    // Update wallet balances for existing test accounts
    for (const profile of profiles || []) {
      const { error: updateError } = await supabase.rpc('increment_wallet_balance', {
        user_id_param: profile.user_id,
        amount_param: 50.00 - (profile.wallet_balance || 0),
        reason_param: 'test_setup'
      });

      if (updateError) {
        console.error(`Failed to update wallet for ${profile.username}:`, updateError);
      } else {
        console.log(`Updated wallet for ${profile.username} to $50.00`);
      }
    }

    // Verify final state
    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('user_id, username, wallet_balance')
      .eq('is_test_account', true)
      .gte('wallet_balance', 5);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${profiles?.length || 0} test profiles`,
        profilesWithFunds: updatedProfiles?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});