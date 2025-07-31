import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CODMultiplayerMatch {
  matchId: string
  mode: string
  startTime: number
  endTime: number
  duration: number
  kills: number
  deaths: number
  assists: number
  kdRatio: number
  score: number
  placement: number
  teamPlacement: number
}

interface KillRaceResult {
  user_id: string
  challenge_id: string
  match_id: string
  kills: number
  deaths: number
  assists: number
  match_duration: number
  match_mode: string
  match_end_time: string
  verified: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id, challenge_id, username, platform = 'xbox' } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const codSessionCookie = Deno.env.get('COD_SESSION_COOKIE')
    if (!codSessionCookie) {
      throw new Error('COD session cookie not configured')
    }

    console.log(`Fetching COD MP stats for ${username} on ${platform}`)

    // Get latest multiplayer match data
    const response = await fetch(
      `https://my.callofduty.com/api/papi-client/stats/cod/v1/title/mw3/platform/${platform}/gamer/${encodeURIComponent(username)}/profile/type/mp`,
      {
        headers: {
          'Cookie': codSessionCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`COD API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.data || data.status !== 'success') {
      throw new Error('Invalid COD API response')
    }

    // Get recent matches for kill race verification
    const matchesResponse = await fetch(
      `https://my.callofduty.com/api/papi-client/crm/cod/v2/title/mw3/platform/${platform}/gamer/${encodeURIComponent(username)}/matches/mp/start/0/end/0/details`,
      {
        headers: {
          'Cookie': codSessionCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    )

    let recentMatches: CODMultiplayerMatch[] = []
    
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json()
      if (matchesData.data && matchesData.data.matches) {
        recentMatches = matchesData.data.matches.slice(0, 5).map((match: any) => ({
          matchId: match.matchID,
          mode: match.mode,
          startTime: match.utcStartSeconds * 1000,
          endTime: match.utcEndSeconds * 1000,
          duration: match.duration,
          kills: match.playerStats?.kills || 0,
          deaths: match.playerStats?.deaths || 0,
          assists: match.playerStats?.assists || 0,
          kdRatio: match.playerStats?.kdRatio || 0,
          score: match.playerStats?.score || 0,
          placement: match.playerStats?.placement || 0,
          teamPlacement: match.teamPlacement || 0
        }))
      }
    }

    // Find the most recent match for kill race verification
    let killRaceResult: KillRaceResult | null = null
    
    if (challenge_id && recentMatches.length > 0) {
      const latestMatch = recentMatches[0]
      
      // Check if this match occurred after the challenge started
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('start_time, created_at')
        .eq('id', challenge_id)
        .single()

      if (!challengeError && challenge) {
        const challengeStartTime = new Date(challenge.start_time || challenge.created_at).getTime()
        const matchEndTime = latestMatch.endTime
        
        if (matchEndTime > challengeStartTime) {
          killRaceResult = {
            user_id,
            challenge_id,
            match_id: latestMatch.matchId,
            kills: latestMatch.kills,
            deaths: latestMatch.deaths,
            assists: latestMatch.assists,
            match_duration: latestMatch.duration,
            match_mode: latestMatch.mode,
            match_end_time: new Date(latestMatch.endTime).toISOString(),
            verified: true
          }

          // Store the kill race result
          const { error: statsError } = await supabase
            .from('challenge_stats')
            .upsert({
              user_id,
              challenge_id,
              kills: latestMatch.kills,
              deaths: latestMatch.deaths,
              assists: latestMatch.assists,
              score: latestMatch.score,
              custom_stats: {
                match_id: latestMatch.matchId,
                match_mode: latestMatch.mode,
                match_duration: latestMatch.duration,
                kd_ratio: latestMatch.kdRatio,
                placement: latestMatch.placement
              },
              verified: true,
              verified_by: null // Auto-verified via API
            }, {
              onConflict: 'user_id,challenge_id'
            })

          if (statsError) {
            console.error('Error storing challenge stats:', statsError)
          }
        }
      }
    }

    // Extract overall stats for display
    const lifetime = data.data.lifetime
    const overallStats = {
      kills: lifetime?.all?.kills || 0,
      deaths: lifetime?.all?.deaths || 0,
      assists: lifetime?.all?.assists || 0,
      kdRatio: lifetime?.all?.kdRatio || 0,
      wins: lifetime?.all?.wins || 0,
      losses: lifetime?.all?.losses || 0,
      winLossRatio: lifetime?.all?.wlRatio || 0,
      score: lifetime?.all?.score || 0,
      timePlayed: lifetime?.all?.timePlayedTotal || 0,
      gamesPlayed: lifetime?.all?.gamesPlayed || 0
    }

    console.log(`COD MP stats retrieved for ${username}:`, {
      kills: overallStats.kills,
      kdRatio: overallStats.kdRatio,
      recentMatches: recentMatches.length,
      killRaceResult: killRaceResult ? 'Generated' : 'None'
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username,
          platform,
          overallStats,
          recentMatches,
          killRaceResult,
          lastUpdated: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('COD multiplayer stats error:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})