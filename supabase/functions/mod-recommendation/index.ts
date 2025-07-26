import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationRequest {
  match_id: string;
  recommendation: string;
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has moderator privileges
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['mod', 'admin']);

    if (roleError || !roleData || roleData.length === 0) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges. Moderator access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { match_id, recommendation, notes }: RecommendationRequest = await req.json();

      if (!match_id || !recommendation) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: match_id and recommendation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate recommendation values
      const validRecommendations = [
        'payout_winner',
        'refund_all', 
        'escalate_admin',
        'need_more_proof',
        'dismiss_invalid'
      ];

      if (!validRecommendations.includes(recommendation)) {
        return new Response(
          JSON.stringify({ error: 'Invalid recommendation value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the flagged match with moderator recommendation
      const { data: updateData, error: updateError } = await supabase
        .from('flagged_matches')
        .update({
          mod_recommendation: recommendation,
          mod_notes: notes || null,
          status: 'under_review',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', match_id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update match recommendation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the moderator action for audit trail
      const { error: logError } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_type: 'moderator_action',
          title: 'Moderator Recommendation',
          description: `Recommended ${recommendation} for flagged match ${match_id}`,
          metadata: {
            match_id,
            recommendation,
            notes,
            timestamp: new Date().toISOString()
          }
        });

      if (logError) {
        console.error('Logging error:', logError);
        // Don't fail the request for logging errors
      }

      console.log(`Moderator ${user.id} recommended ${recommendation} for match ${match_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: updateData?.[0],
          message: 'Recommendation submitted successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});