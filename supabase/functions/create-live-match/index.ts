import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId, stakeTier, participants } = await req.json();
    
    console.log('Creating live match with params:', { gameId, stakeTier, participants });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // First, get the actual game UUID from the game name
    const { data: gameData, error: gameError } = await supabaseService
      .from("games")
      .select("id")
      .eq("name", gameId)
      .single();

    if (gameError || !gameData) {
      throw new Error(`Game not found: ${gameId}`);
    }

    // Create the live challenge
    const { data: challenge, error: challengeError } = await supabaseService
      .from("challenges")
      .insert({
        title: `Live Match - ${stakeTier} Tier`,
        description: "AI-Generated live match with instant matchmaking",
        game_id: gameData.id,
        platform: "Xbox",
        stake_amount: getStakeAmount(stakeTier),
        challenge_type: "live_match",
        status: "active",
        max_participants: participants || 2,
        creator_id: "00000000-0000-0000-0000-000000000000", // System user
        verification_method: "automated",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })
      .select()
      .single();

    if (challengeError) {
      throw new Error(`Failed to create challenge: ${challengeError.message}`);
    }

    // Create lobby session
    const { data: lobby, error: lobbyError } = await supabaseService
      .from("lobby_sessions")
      .insert({
        lobby_id: `LIVE-${Date.now()}`,
        game_id: gameId,
        platform: "Xbox",
        max_participants: participants || 2,
        created_by: "00000000-0000-0000-0000-000000000000",
        status: "active"
      })
      .select()
      .single();

    if (lobbyError) {
      console.error('Lobby creation error:', lobbyError);
    }

    // Create automation entry for match monitoring
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "live_match_creation",
        action_type: "challenge_created",
        success: true,
        target_id: challenge.id,
        action_data: {
          gameId,
          stakeTier,
          participants,
          lobbyId: lobby?.lobby_id,
          estimatedDuration: "30 minutes"
        }
      });

    console.log('Live match created successfully:', {
      challengeId: challenge.id,
      lobbyId: lobby?.lobby_id
    });

    return new Response(JSON.stringify({
      success: true,
      match: {
        id: challenge.id,
        title: challenge.title,
        lobbyId: lobby?.lobby_id,
        stakeAmount: challenge.stake_amount,
        status: "active",
        joinCode: `JOIN-${challenge.id.slice(0, 6).toUpperCase()}`,
        startTime: challenge.start_time,
        endTime: challenge.end_time,
        participants: 0,
        maxParticipants: challenge.max_participants
      },
      message: "Live match created and ready for players!"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating live match:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to create live match",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function getStakeAmount(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'bronze': return 10;
    case 'silver': return 25;
    case 'gold': return 50;
    case 'platinum': return 100;
    case 'diamond': return 250;
    default: return 25;
  }
}