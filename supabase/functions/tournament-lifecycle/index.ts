import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎯 Tournament Lifecycle Manager Starting...')
    
    const results = {
      closed_registration: 0,
      started_tournaments: 0,
      generated_brackets: 0,
      created_lobbies: 0,
      errors: []
    }

    // Step 1: Cancel tournaments that don't have enough participants 15 minutes after start time
    const cancelThreshold = new Date(Date.now()).toISOString()
    const { data: tournamentsToCancel } = await supabase
      .from('tournaments')
      .select('*')
      .in('tournament_status', ['registration_open', 'registration_closed'])
      .lte('start_time', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // 15 minutes ago
      .lt('current_participants', 2)

    console.log(`Found ${tournamentsToCancel?.length || 0} tournaments to cancel due to low participation`)

    for (const tournament of tournamentsToCancel || []) {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          tournament_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id)

      if (error) {
        console.error(`Error cancelling tournament ${tournament.id}:`, error)
        results.errors.push(`Tournament cancellation failed: ${error.message}`)
      } else {
        results.closed_registration++
        console.log(`❌ Cancelled tournament due to low participation: ${tournament.title}`)
      }
    }

    // Step 2: Close registration for tournaments that have reached their deadline
    const { data: registrationExpired } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tournament_status', 'registration_open')
      .lte('registration_closes_at', new Date().toISOString())

    console.log(`Found ${registrationExpired?.length || 0} tournaments with expired registration`)

    for (const tournament of registrationExpired || []) {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          tournament_status: 'registration_closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id)

      if (error) {
        console.error(`Error closing registration for tournament ${tournament.id}:`, error)
        results.errors.push(`Registration closure failed: ${error.message}`)
      } else {
        results.closed_registration++
        console.log(`✅ Closed registration for tournament: ${tournament.title}`)
      }
    }

    // Step 2: Start tournaments that have reached their start time and have enough participants
    const { data: readyToStart } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tournament_status', 'registration_closed')
      .lte('start_time', new Date().toISOString())
      .gte('current_participants', 2)

    console.log(`Found ${readyToStart?.length || 0} tournaments ready to start`)

    for (const tournament of readyToStart || []) {
      try {
        // Generate tournament bracket
        const { data: bracketData, error: bracketError } = await supabase.functions.invoke('generate-tournament-bracket', {
          body: { tournamentId: tournament.id }
        })

        if (bracketError) {
          console.error(`Bracket generation failed for ${tournament.id}:`, bracketError)
          results.errors.push(`Bracket generation failed: ${bracketError.message}`)
          continue
        }

        // Update tournament status to in_progress
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({ 
            tournament_status: 'in_progress',
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', tournament.id)

        if (updateError) {
          console.error(`Error updating tournament status ${tournament.id}:`, updateError)
          results.errors.push(`Status update failed: ${updateError.message}`)
          continue
        }

        // Create lobby sessions for first round matches
        await createTournamentLobbies(tournament.id)

        results.started_tournaments++
        results.generated_brackets++
        results.created_lobbies++
        
        console.log(`🚀 Started tournament: ${tournament.title} with ${bracketData.matchesCreated} matches`)

        // Send notifications to registered players
        await notifyTournamentStart(tournament.id)

      } catch (error: any) {
        console.error(`Error processing tournament ${tournament.id}:`, error)
        results.errors.push(`Tournament start failed: ${error.message}`)
      }
    }

    // Step 3: Handle tournament timeouts and no-shows
    await handleTournamentTimeouts()

    // Step 4: Cancel tournaments that have been running too long without completion
    await cancelStuckTournaments()

    console.log('🎯 Tournament Lifecycle Manager Complete:', results)

    return new Response(JSON.stringify({
      success: true,
      message: `Tournament lifecycle management completed`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Tournament lifecycle error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function createTournamentLobbies(tournamentId: string) {
  console.log(`🎮 Creating lobbies for tournament: ${tournamentId}`)
  
  // Get first round matches
  const { data: firstRoundMatches } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('round_number', 1)
    .eq('status', 'pending')

  for (const match of firstRoundMatches || []) {
    // Generate unique lobby ID
    const lobbyId = generateLobbyId()
    
    // Create lobby session
    const { error: lobbyError } = await supabase
      .from('lobby_sessions')
      .insert({
        lobby_id: lobbyId,
        game_id: match.game_id || null,
        platform: 'PC', // Default platform
        created_by: match.player_1_id,
        max_participants: 2,
        status: 'active'
      })

    if (lobbyError) {
      console.error(`Error creating lobby for match ${match.id}:`, lobbyError)
      continue
    }

    // Update match with lobby information
    await supabase
      .from('tournament_matches')
      .update({
        lobby_id: lobbyId,
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', match.id)

    console.log(`✅ Created lobby ${lobbyId} for match ${match.id}`)
  }
}

async function notifyTournamentStart(tournamentId: string) {
  console.log(`📢 Sending tournament start notifications for: ${tournamentId}`)
  
  // Get all registered players
  const { data: registrations } = await supabase
    .from('tournament_registrations')
    .select('user_id')
    .eq('tournament_id', tournamentId)
    .eq('status', 'registered')

  // Create notifications for each player
  for (const registration of registrations || []) {
    await supabase
      .from('activities')
      .insert({
        user_id: registration.user_id,
        activity_type: 'tournament_started',
        title: 'Tournament Started!',
        description: 'Your tournament has begun. Check your first match details.',
        metadata: { tournament_id: tournamentId }
      })
  }
}

async function handleTournamentTimeouts() {
  console.log(`⏰ Handling tournament timeouts...`)
  
  // Find matches that have been waiting too long (30 minutes)
  const timeoutThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  
  const { data: timedOutMatches } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('status', 'ready')
    .lte('created_at', timeoutThreshold)

  for (const match of timedOutMatches || []) {
    // Award win to player who showed up (if any)
    let winnerId = null
    
    // Simple logic: if one player reported stats, they win
    const { data: stats } = await supabase
      .from('challenge_stats')
      .select('user_id')
      .eq('challenge_id', match.id)
    
    if (stats && stats.length === 1) {
      winnerId = stats[0].user_id
    }

    // Update match as completed due to timeout
    await supabase
      .from('tournament_matches')
      .update({
        status: 'completed',
        winner_id: winnerId,
        completion_reason: 'timeout',
        updated_at: new Date().toISOString()
      })
      .eq('id', match.id)

    console.log(`⏰ Match ${match.id} timed out, winner: ${winnerId || 'none'}`)
  }
}

async function cancelStuckTournaments() {
  console.log(`🛑 Checking for stuck tournaments...`)
  
  // Cancel tournaments that have been in progress for more than 2 hours
  const stuckThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  
  const { data: stuckTournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('tournament_status', 'in_progress')
    .lte('updated_at', stuckThreshold)

  for (const tournament of stuckTournaments || []) {
    // Cancel the tournament
    const { error } = await supabase
      .from('tournaments')
      .update({
        tournament_status: 'cancelled',
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', tournament.id)

    if (error) {
      console.error(`Error cancelling stuck tournament ${tournament.id}:`, error)
    } else {
      console.log(`🛑 Cancelled stuck tournament: ${tournament.title}`)
      
      // Cancel all pending matches
      await supabase
        .from('tournament_matches')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('tournament_id', tournament.id)
        .in('status', ['pending', 'ready'])
    }
  }
}

function generateLobbyId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}