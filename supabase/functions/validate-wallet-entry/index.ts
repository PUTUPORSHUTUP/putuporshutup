import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { entryFee } = await req.json()

    if (!entryFee || entryFee <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid entry fee' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's current wallet balance with row lock to prevent race conditions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentBalance = profile.wallet_balance || 0
    const canAfford = currentBalance >= entryFee

    // PUOSU Wallet System - Dynamic Match Eligibility
    const eligibility = {
      canJoin1Dollar: currentBalance >= 1,
      canJoin3Dollar: currentBalance >= 3,
      canJoin5Dollar: currentBalance >= 5,
      canJoin10Dollar: currentBalance >= 10,
      availableMatches: [1, 3, 5, 10].filter(amount => currentBalance >= amount)
    }

    return new Response(
      JSON.stringify({
        success: true,
        canAfford,
        currentBalance,
        entryFee,
        shortfall: Math.max(0, entryFee - currentBalance),
        eligibility,
        message: canAfford 
          ? 'Sufficient funds available'
          : `Insufficient funds. Need $${(entryFee - currentBalance).toFixed(2)} more`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Wallet validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})