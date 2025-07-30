import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PUOSU Xbox Live Configuration
const PUOSU_XBOX_CONFIG = {
  titleId: "2140035565",
  scid: "00000000-0000-0000-0000-00007f8e521d",
  sandboxId: "BTWDGW.158"
};

interface XboxMatchResult {
  matchId: string;
  xuid: string;
  gamertag: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  placement: number;
  gameMode: string;
  matchDuration: number;
  timestamp: string;
  isValid: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, challengeId, xuid, matchData } = await req.json();
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const xboxToken = Deno.env.get("XBOX_LIVE_TOKEN");
    const openXblApiKey = Deno.env.get("OPENXBL_API_KEY");
    
    if (!openXblApiKey) {
      throw new Error("Xbox API keys not configured");
    }

    console.log(`Processing Xbox match verification: ${action}`);

    switch (action) {
      case "verify_match_result":
        return await verifyMatchResult(challengeId, xuid, matchData, supabaseService, openXblApiKey);
      
      case "fetch_recent_matches":
        return await fetchRecentMatches(xuid, openXblApiKey, supabaseService);
      
      case "auto_verify_challenge":
        return await autoVerifyChallenge(challengeId, supabaseService, openXblApiKey);
      
      case "update_leaderboard":
        return await updateLeaderboard(xuid, matchData, supabaseService);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error("Error in Xbox match verification:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to verify Xbox match",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function verifyMatchResult(challengeId: string, xuid: string, matchData: any, supabase: any, apiKey: string): Promise<Response> {
  console.log(`Verifying match result for challenge ${challengeId}, XUID: ${xuid}`);

  // Get challenge details
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("*, challenge_participants(*)")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    throw new Error("Challenge not found");
  }

  // Fetch latest match data from Xbox Live
  const matchResponse = await fetch(`https://xbl.io/api/v2/player/xuid/${xuid}/activity/recent`, {
    headers: {
      "X-Authorization": apiKey,
      "Content-Type": "application/json"
    }
  });

  if (!matchResponse.ok) {
    throw new Error(`Failed to fetch Xbox match data: ${matchResponse.status}`);
  }

  const xboxData = await matchResponse.json();
  
  // Verify match authenticity and extract stats
  const verifiedMatch = await validateMatchData(xboxData, matchData, challenge);
  
  if (verifiedMatch.isValid) {
    // Update challenge stats in database
    const { error: statsError } = await supabase
      .from("challenge_stats")
      .upsert({
        challenge_id: challengeId,
        user_id: verifiedMatch.userId,
        kills: verifiedMatch.kills,
        deaths: verifiedMatch.deaths,
        assists: verifiedMatch.assists,
        score: verifiedMatch.score,
        placement: verifiedMatch.placement,
        verified: true,
        verified_by: "xbox_live_api",
        custom_stats: {
          matchId: verifiedMatch.matchId,
          gameMode: verifiedMatch.gameMode,
          matchDuration: verifiedMatch.matchDuration,
          timestamp: verifiedMatch.timestamp,
          xuid: xuid
        }
      });

    if (statsError) {
      throw new Error(`Failed to save verified stats: ${statsError.message}`);
    }

    // Log verification activity
    await supabase
      .from("activities")
      .insert({
        user_id: verifiedMatch.userId,
        activity_type: "xbox_match_verified",
        title: "Match Automatically Verified",
        description: `Xbox Live API verified match results: ${verifiedMatch.kills}K/${verifiedMatch.deaths}D/${verifiedMatch.assists}A`,
        metadata: {
          challengeId: challengeId,
          matchId: verifiedMatch.matchId,
          verification_source: "xbox_live_api",
          stats: verifiedMatch
        }
      });

    // Check if this determines a winner and trigger auto-payout
    await checkAndProcessWinner(challengeId, supabase);

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      matchResult: verifiedMatch,
      message: "Match result verified via Xbox Live API"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } else {
    return new Response(JSON.stringify({
      success: false,
      verified: false,
      error: "Match data could not be verified",
      reasons: verifiedMatch.validationErrors || []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}

async function validateMatchData(xboxData: any, submittedData: any, challenge: any): Promise<any> {
  const validationErrors: string[] = [];
  
  // Find the most recent match that matches the game type
  const recentMatch = xboxData.find((match: any) => 
    match.titleId === PUOSU_XBOX_CONFIG.titleId &&
    new Date(match.lastSeen) > new Date(challenge.start_time)
  );

  if (!recentMatch) {
    validationErrors.push("No recent match found for this game");
    return { isValid: false, validationErrors };
  }

  // Validate submitted stats against Xbox data
  const statsMatch = {
    kills: recentMatch.stats?.kills || 0,
    deaths: recentMatch.stats?.deaths || 0,
    assists: recentMatch.stats?.assists || 0,
    score: recentMatch.stats?.score || 0,
    placement: recentMatch.stats?.placement || 0
  };

  // Allow for minor discrepancies (±1) to account for API delays
  const tolerance = 1;
  
  if (Math.abs(statsMatch.kills - submittedData.kills) > tolerance) {
    validationErrors.push(`Kill count mismatch: Xbox=${statsMatch.kills}, Submitted=${submittedData.kills}`);
  }
  
  if (Math.abs(statsMatch.deaths - submittedData.deaths) > tolerance) {
    validationErrors.push(`Death count mismatch: Xbox=${statsMatch.deaths}, Submitted=${submittedData.deaths}`);
  }

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    matchId: recentMatch.matchId,
    kills: statsMatch.kills,
    deaths: statsMatch.deaths,
    assists: statsMatch.assists,
    score: statsMatch.score,
    placement: statsMatch.placement,
    gameMode: recentMatch.gameMode,
    matchDuration: recentMatch.duration,
    timestamp: recentMatch.lastSeen,
    userId: challenge.challenge_participants.find((p: any) => p.user_id)?.user_id
  };
}

async function fetchRecentMatches(xuid: string, apiKey: string, supabase: any): Promise<Response> {
  const response = await fetch(`https://xbl.io/api/v2/player/xuid/${xuid}/activity/recent`, {
    headers: {
      "X-Authorization": apiKey,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recent matches: ${response.status}`);
  }

  const matches = await response.json();
  
  // Filter for PUOSU title matches
  const puosuMatches = matches.filter((match: any) => 
    match.titleId === PUOSU_XBOX_CONFIG.titleId
  );

  return new Response(JSON.stringify({
    success: true,
    matches: puosuMatches,
    totalMatches: puosuMatches.length
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function autoVerifyChallenge(challengeId: string, supabase: any, apiKey: string): Promise<Response> {
  // Get all participants in the challenge
  const { data: participants, error } = await supabase
    .from("challenge_participants")
    .select(`
      *,
      profiles!inner(xbox_xuid, xbox_gamertag)
    `)
    .eq("challenge_id", challengeId);

  if (error || !participants) {
    throw new Error("Failed to fetch challenge participants");
  }

  const verificationResults = [];

  for (const participant of participants) {
    if (participant.profiles.xbox_xuid) {
      try {
        // Fetch recent match data for this participant
        const matchResponse = await fetch(`https://xbl.io/api/v2/player/xuid/${participant.profiles.xbox_xuid}/activity/recent`, {
          headers: {
            "X-Authorization": apiKey,
            "Content-Type": "application/json"
          }
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          const latestMatch = matchData[0]; // Most recent match
          
          if (latestMatch && latestMatch.titleId === PUOSU_XBOX_CONFIG.titleId) {
            // Auto-submit verified stats
            await supabase
              .from("challenge_stats")
              .upsert({
                challenge_id: challengeId,
                user_id: participant.user_id,
                kills: latestMatch.stats?.kills || 0,
                deaths: latestMatch.stats?.deaths || 0,
                assists: latestMatch.stats?.assists || 0,
                score: latestMatch.stats?.score || 0,
                placement: latestMatch.stats?.placement || 0,
                verified: true,
                verified_by: "xbox_auto_verification",
                custom_stats: {
                  matchId: latestMatch.matchId,
                  xuid: participant.profiles.xbox_xuid,
                  auto_verified: true
                }
              });

            verificationResults.push({
              userId: participant.user_id,
              gamertag: participant.profiles.xbox_gamertag,
              verified: true,
              stats: latestMatch.stats
            });
          }
        }
      } catch (error) {
        console.error(`Failed to verify participant ${participant.user_id}:`, error);
        verificationResults.push({
          userId: participant.user_id,
          verified: false,
          error: error.message
        });
      }
    }
  }

  // Check for winner and process payout
  await checkAndProcessWinner(challengeId, supabase);

  return new Response(JSON.stringify({
    success: true,
    verificationResults,
    totalParticipants: participants.length,
    verifiedCount: verificationResults.filter(r => r.verified).length
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function checkAndProcessWinner(challengeId: string, supabase: any): Promise<void> {
  // Get all verified stats for this challenge
  const { data: stats, error } = await supabase
    .from("challenge_stats")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("verified", true);

  if (error || !stats || stats.length === 0) {
    return;
  }

  // Determine winner based on stat criteria (e.g., highest K/D, most kills, etc.)
  const winner = stats.reduce((best, current) => {
    const bestKD = best.kills / Math.max(best.deaths, 1);
    const currentKD = current.kills / Math.max(current.deaths, 1);
    
    return currentKD > bestKD ? current : best;
  });

  // Update challenge with winner
  await supabase
    .from("challenges")
    .update({
      winner_id: winner.user_id,
      status: "completed",
      end_time: new Date().toISOString()
    })
    .eq("id", challengeId);

  // Trigger automated payout
  await supabase.functions.invoke('automated-payout-processor', {
    body: {
      challengeId: challengeId,
      winnerId: winner.user_id,
      verificationMethod: "xbox_live_api"
    }
  });

  console.log(`Challenge ${challengeId} completed. Winner: ${winner.user_id}`);
}

async function updateLeaderboard(xuid: string, matchData: any, supabase: any): Promise<Response> {
  // Update Xbox Live leaderboard stats
  const { error } = await supabase
    .from("xbox_leaderboard_stats")
    .upsert({
      xuid: xuid,
      total_kills: matchData.kills,
      total_deaths: matchData.deaths,
      total_assists: matchData.assists,
      total_score: matchData.score,
      matches_played: 1,
      last_match_at: new Date().toISOString()
    }, {
      onConflict: 'xuid',
      ignoreDuplicates: false
    });

  if (error) {
    throw new Error(`Failed to update leaderboard: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Leaderboard updated successfully"
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}