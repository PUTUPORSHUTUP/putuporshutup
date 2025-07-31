import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface XboxGameActivity {
  titleId: string
  titleName: string
  state: string
  lastPlayed: string
  activityId?: string
}

interface GamePresence {
  user_id: string
  xbox_xuid: string
  current_game: string | null
  game_title_id: string | null
  activity_state: string
  last_seen_at: string
  is_online: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const xboxApiKey = Deno.env.get('XBOX_API_KEY')
    if (!xboxApiKey) {
      throw new Error('Xbox API key not configured')
    }

    // Get all users with Xbox XUIDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, xbox_xuid, xbox_gamertag')
      .not('xbox_xuid', 'is', null)
      .eq('xbox_linked', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

    console.log(`Tracking game activity for ${profiles.length} Xbox-linked users`)

    const presenceUpdates: GamePresence[] = []

    // Check each user's current game activity
    for (const profile of profiles) {
      try {
        // Get current game activity from Xbox API
        const response = await fetch(
          `https://xboxapi.com/v2/${profile.xbox_xuid}/activity`,
          {
            headers: {
              'X-AUTH': xboxApiKey,
            },
          }
        )

        if (!response.ok) {
          console.log(`Failed to get activity for ${profile.xbox_gamertag}: ${response.status}`)
          continue
        }

        const activityData = await response.json()
        
        let currentGame: string | null = null
        let gameTitleId: string | null = null
        let activityState = 'offline'
        let isOnline = false

        // Parse Xbox activity response
        if (activityData && activityData.length > 0) {
          const currentActivity = activityData[0] as XboxGameActivity
          
          if (currentActivity.state === 'Active' || currentActivity.state === 'Playing') {
            currentGame = currentActivity.titleName
            gameTitleId = currentActivity.titleId
            activityState = 'playing'
            isOnline = true
          } else if (currentActivity.state === 'Online') {
            activityState = 'online'
            isOnline = true
          }
        }

        const presence: GamePresence = {
          user_id: profile.user_id,
          xbox_xuid: profile.xbox_xuid,
          current_game: currentGame,
          game_title_id: gameTitleId,
          activity_state: activityState,
          last_seen_at: new Date().toISOString(),
          is_online: isOnline
        }

        presenceUpdates.push(presence)

        console.log(`${profile.xbox_gamertag}: ${currentGame || 'Not playing'} (${activityState})`)

      } catch (error) {
        console.error(`Error tracking ${profile.xbox_gamertag}:`, error)
      }
    }

    // Batch update presence data
    if (presenceUpdates.length > 0) {
      const { error: upsertError } = await supabase
        .from('game_presence')
        .upsert(presenceUpdates, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })

      if (upsertError) {
        console.error('Error upserting presence data:', upsertError)
        throw upsertError
      }

      // Broadcast real-time updates to all channels
      for (const presence of presenceUpdates) {
        await supabase.channel('game_activity')
          .send({
            type: 'broadcast',
            event: 'presence_update',
            payload: presence
          })
      }
    }

    // Log activity for analytics
    await supabase
      .from('automated_actions')
      .insert({
        automation_type: 'game_activity_tracker',
        action_type: 'presence_sync',
        success: true,
        action_data: {
          users_tracked: profiles.length,
          presence_updates: presenceUpdates.length,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        users_tracked: profiles.length,
        presence_updates: presenceUpdates.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Live game tracker error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})