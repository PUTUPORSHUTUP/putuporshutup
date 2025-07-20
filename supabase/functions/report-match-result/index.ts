import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportResultRequest {
  matchId: string;
  winnerId: string;
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user token')
    }

    const { matchId, winnerId }: ReportResultRequest = await req.json()

    console.log(`User ${user.id} reporting result for match ${matchId}, winner: ${winnerId}`)

    // Get the match details
    const { data: match, error: matchError } = await supabaseClient
      .from('tournament_matches')
      .select('*, tournaments(*)')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      throw new Error('Match not found')
    }

    // Check if user is a participant in this match
    const isPlayer1 = match.player1_id === user.id
    const isPlayer2 = match.player2_id === user.id
    const isOrganizer = match.tournaments.creator_id === user.id

    if (!isPlayer1 && !isPlayer2 && !isOrganizer) {
      throw new Error('Not authorized to report result for this match')
    }

    // Determine which field to update
    const updateField = isPlayer1 ? 'player1_reported_winner' : 
                       isPlayer2 ? 'player2_reported_winner' : null

    let updateData: any = {}

    if (isOrganizer) {
      // Organizer can directly set the winner
      updateData = {
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        confirmed_by_organizer: true
      }
    } else if (updateField) {
      // Player reporting result
      updateData = {
        [updateField]: winnerId
      }

      // Check if this creates a consensus or dispute
      const otherPlayerField = isPlayer1 ? 'player2_reported_winner' : 'player1_reported_winner'
      const otherPlayerReported = isPlayer1 ? match.player2_reported_winner : match.player1_reported_winner

      if (otherPlayerReported) {
        if (otherPlayerReported === winnerId) {
          // Both players agree - confirm the result
          updateData.winner_id = winnerId
          updateData.status = 'completed'
          updateData.completed_at = new Date().toISOString()
          updateData.result_disputed = false
        } else {
          // Players disagree - mark as disputed
          updateData.result_disputed = true
        }
      }
    }

    // Update the match
    const { error: updateError } = await supabaseClient
      .from('tournament_matches')
      .update(updateData)
      .eq('id', matchId)

    if (updateError) {
      throw updateError
    }

    // If match is completed, progress the tournament bracket
    if (updateData.winner_id && updateData.status === 'completed') {
      await progressTournamentBracket(supabaseClient, match, winnerId)
    }

    console.log(`Result reported successfully for match ${matchId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: updateData.result_disputed ? 'Result disputed - organizer will resolve' : 'Result reported successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error reporting match result:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

async function progressTournamentBracket(supabaseClient: any, completedMatch: any, winnerId: string) {
  try {
    const tournament = completedMatch.tournaments
    const currentRound = completedMatch.round_number
    const totalRounds = Math.log2(tournament.max_participants)

    // If this was the final round, update tournament winner
    if (currentRound === totalRounds) {
      await supabaseClient
        .from('tournaments')
        .update({ 
          winner_id: winnerId, 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id)

      console.log(`Tournament ${tournament.id} completed with winner ${winnerId}`)
      return
    }

    // Find the next round match this winner should advance to
    const nextRoundMatchNumber = Math.ceil(completedMatch.match_number / 2)
    
    const { data: nextMatch, error: nextMatchError } = await supabaseClient
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournament.id)
      .eq('round_number', currentRound + 1)
      .eq('match_number', nextRoundMatchNumber)
      .single()

    if (nextMatchError || !nextMatch) {
      console.error('Next round match not found:', nextMatchError)
      return
    }

    // Determine if winner goes to player1 or player2 slot
    const isUpperBracket = (completedMatch.match_number - 1) % 2 === 0
    const slotToUpdate = isUpperBracket ? 'player1_id' : 'player2_id'

    await supabaseClient
      .from('tournament_matches')
      .update({ [slotToUpdate]: winnerId })
      .eq('id', nextMatch.id)

    console.log(`Advanced winner ${winnerId} to next round match ${nextMatch.id}`)

  } catch (error) {
    console.error('Error progressing tournament bracket:', error)
  }
}