import { supabase } from '@/integrations/supabase/client';

interface ModRecommendationParams {
  matchId: string;
  recommendation: string;
  notes?: string;
}

export const modRecommendation = async ({ matchId, recommendation, notes }: ModRecommendationParams) => {
  try {
    // Get the current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const { data, error } = await supabase.functions.invoke('mod-recommendation', {
      body: {
        match_id: matchId,
        recommendation,
        notes
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to submit recommendation');
    }

    return data;
  } catch (error) {
    console.error('modRecommendation error:', error);
    throw error;
  }
};

// Helper function for moderator actions
export const submitModeratorAction = async (
  matchId: string, 
  action: 'flag_user' | 'request_proof' | 'escalate',
  details?: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    // For now, we'll update the flagged_matches table directly
    // In the future, this could be expanded to handle different types of actions
    const { data, error } = await supabase
      .from('flagged_matches')
      .update({
        mod_notes: `${action.toUpperCase()}: ${details || 'No additional details'}`,
        status: action === 'escalate' ? 'escalated' : 'under_review',
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    // Log the action
    await supabase
      .from('activities')
      .insert({
        user_id: session.user.id,
        activity_type: 'moderator_action',
        title: `Moderator ${action.replace('_', ' ').toUpperCase()}`,
        description: `Performed ${action} on flagged match ${matchId}`,
        metadata: {
          match_id: matchId,
          action,
          details,
          timestamp: new Date().toISOString()
        }
      });

    return data;
  } catch (error) {
    console.error('submitModeratorAction error:', error);
    throw error;
  }
};