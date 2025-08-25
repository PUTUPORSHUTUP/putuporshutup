import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchTier {
  entry_fee: number;
  vip_required: boolean;
  payout_type: string;
}

const MATCH_TIERS: MatchTier[] = [
  { entry_fee: 1.00, vip_required: false, payout_type: 'winner_take_all' },
  { entry_fee: 5.00, vip_required: false, payout_type: 'winner_take_all' },
  { entry_fee: 10.00, vip_required: true, payout_type: 'winner_take_all' }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 AUTO-CYCLE-MATCHES: Starting match rotation');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { manual } = await req.json();
    console.log('Manual trigger:', manual);

    // Get or create rotation state
    let { data: rotationState, error: rotationError } = await supabase
      .from('match_cycle_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (rotationError || !rotationState) {
      console.log('Creating rotation state...');
      const { data: newState, error: createError } = await supabase
        .from('match_cycle_state')
        .insert({ id: 1, idx: 0, last_created: new Date().toISOString() })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create rotation state:', createError);
        throw createError;
      }
      rotationState = newState;
    }

    // Get current tier
    const currentTier = MATCH_TIERS[rotationState.idx % MATCH_TIERS.length];
    console.log(`Current tier: $${currentTier.entry_fee} (VIP: ${currentTier.vip_required})`);

    // Calculate match start time (1 minute from now for demo purposes)
    const startsAt = new Date(Date.now() + 60 * 1000);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Get available test users for automated matches
    const { data: availableUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_test_user', true)
      .gte('wallet_balance', currentTier.entry_fee)
      .limit(10);

    const { data: defaultGame } = await supabase
      .from('games')
      .select('id')
      .limit(1)
      .single();

    if (!availableUsers?.length || !defaultGame) {
      throw new Error('No available users or games found for automated match');
    }

    // Use first available user
    const selectedUser = availableUsers[0];
    console.log('Using user:', selectedUser.user_id, 'for automated match');

    // Clean up any existing entries for this user to avoid unique constraint violation
    console.log('Cleaning up existing entries for user...');
    await supabase
      .from('match_queue')
      .delete()
      .eq('user_id', selectedUser.user_id);

    // Create the match
    const { data: match, error: matchError } = await supabase
      .from('match_queue')
      .insert({
        user_id: selectedUser.user_id,
        stake_amount: currentTier.entry_fee,
        game_id: defaultGame.id,
        platform: 'Xbox',
        queue_status: 'searching',
        queued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        entry_fee: currentTier.entry_fee,
        payout_type: currentTier.payout_type,
        vip_required: currentTier.vip_required,
        automated: true,
        game_mode_key: 'competitive'
      })
      .select()
      .single();

    if (matchError) {
      console.error('Failed to create match:', matchError);
      throw matchError;
    }

    console.log('✅ Created automated match:', match.id);

    // Update rotation state to next tier
    const nextIdx = (rotationState.idx + 1) % MATCH_TIERS.length;
    const { error: updateError } = await supabase
      .from('match_cycle_state')
      .update({ 
        idx: nextIdx, 
        last_created: new Date().toISOString() 
      })
      .eq('id', 1);

    if (updateError) {
      console.error('Failed to update rotation state:', updateError);
    }

    console.log(`🔄 Rotated to next tier index: ${nextIdx}`);

    return new Response(JSON.stringify({
      success: true,
      match_id: match.id,
      tier: currentTier,
      next_tier_index: nextIdx,
      message: `Created $${currentTier.entry_fee} match (VIP: ${currentTier.vip_required})`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Auto-cycle-matches error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});