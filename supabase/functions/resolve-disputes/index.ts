import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Dispute {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  status: string
  wager_id?: string
  tournament_match_id?: string
  evidence_urls?: string[]
  created_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting automated dispute resolution process...');

    // Get pending disputes older than 24 hours
    const { data: disputes, error: disputesError } = await supabaseClient
      .from('disputes')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (disputesError) {
      console.error('Error fetching disputes:', disputesError);
      throw disputesError;
    }

    console.log(`Found ${disputes?.length || 0} disputes to review`);

    let resolvedCount = 0;
    const results = [];

    for (const dispute of disputes || []) {
      try {
        const resolution = await processDispute(supabaseClient, dispute);
        if (resolution.resolved) {
          resolvedCount++;
        }
        results.push(resolution);
      } catch (error) {
        console.error(`Error processing dispute ${dispute.id}:`, error);
        results.push({
          disputeId: dispute.id,
          resolved: false,
          error: error.message
        });
      }
    }

    console.log(`Resolved ${resolvedCount} disputes automatically`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${disputes?.length || 0} disputes, resolved ${resolvedCount}`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in resolve-disputes function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processDispute(supabaseClient: any, dispute: Dispute) {
  console.log(`Processing dispute ${dispute.id} of type: ${dispute.type}`);

  // Auto-resolution logic based on dispute type and evidence
  const shouldResolve = await shouldAutoResolve(supabaseClient, dispute);
  
  if (!shouldResolve.resolve) {
    return {
      disputeId: dispute.id,
      resolved: false,
      reason: shouldResolve.reason
    };
  }

  // Update dispute status to resolved
  const { error: updateError } = await supabaseClient
    .from('disputes')
    .update({
      status: 'resolved',
      admin_response: shouldResolve.resolution,
      resolved_by: null, // System resolution
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', dispute.id);

  if (updateError) {
    throw updateError;
  }

  // Log the automated resolution
  await supabaseClient
    .from('activities')
    .insert({
      user_id: dispute.user_id,
      activity_type: 'dispute_resolved',
      title: 'Dispute Auto-Resolved',
      description: `Dispute "${dispute.title}" was automatically resolved by the system`,
      metadata: {
        dispute_id: dispute.id,
        resolution_type: 'automated',
        resolution_reason: shouldResolve.reason,
        timestamp: new Date().toISOString()
      }
    });

  return {
    disputeId: dispute.id,
    resolved: true,
    resolution: shouldResolve.resolution,
    reason: shouldResolve.reason
  };
}

async function shouldAutoResolve(supabaseClient: any, dispute: Dispute) {
  // Check if dispute has been pending for more than 48 hours
  const age = Date.now() - new Date(dispute.created_at).getTime();
  const hoursSinceCreated = age / (1000 * 60 * 60);

  // Auto-resolve disputes older than 48 hours with no evidence
  if (hoursSinceCreated > 48 && (!dispute.evidence_urls || dispute.evidence_urls.length === 0)) {
    return {
      resolve: true,
      reason: 'No evidence provided within 48 hours',
      resolution: 'This dispute has been automatically resolved due to insufficient evidence provided within the required timeframe. If you have new evidence, please submit a new dispute.'
    };
  }

  // Check for specific dispute types that can be auto-resolved
  if (dispute.type === 'payment_issue') {
    // Check if there's a recent successful payment for this user
    const { data: recentPayments } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', dispute.user_id)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentPayments && recentPayments.length > 0) {
      return {
        resolve: true,
        reason: 'Recent successful payment found',
        resolution: 'This payment dispute has been resolved as we found a successful transaction in your account within the last 7 days.'
      };
    }
  }

  // Auto-resolve disputes for inactive wagers/tournaments
  if (dispute.wager_id) {
    const { data: wager } = await supabaseClient
      .from('challenges')
      .select('status, updated_at')
      .eq('id', dispute.wager_id)
      .single();

    if (wager && (wager.status === 'completed' || wager.status === 'cancelled')) {
      const daysSinceUpdate = (Date.now() - new Date(wager.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 7) {
        return {
          resolve: true,
          reason: 'Related wager completed/cancelled more than 7 days ago',
          resolution: 'This dispute has been automatically resolved as the related wager was completed or cancelled more than 7 days ago.'
        };
      }
    }
  }

  // Don't auto-resolve if none of the criteria are met
  return {
    resolve: false,
    reason: 'Requires manual review'
  };
}