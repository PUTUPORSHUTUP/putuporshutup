import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
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
    const { riotName, tagLine, region = "americas" } = await req.json();
    
    if (!riotName || !tagLine) {
      return new Response(JSON.stringify({ 
        error: "Missing Riot ID (name#tag) parameters" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get API key from environment
    const apiKey = Deno.env.get("VALORANT_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Valorant API key not configured" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encodedName = encodeURIComponent(riotName);
    const encodedTag = encodeURIComponent(tagLine);
    
    // First get account PUUID
    const accountURL = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`;
    
    console.log(`Fetching Valorant account for ${riotName}#${tagLine}`);

    const accountResponse = await fetch(accountURL, {
      method: "GET",
      headers: {
        "X-Riot-Token": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "Xbox-Gaming-Platform/1.0"
      },
    });

    if (!accountResponse.ok) {
      console.error(`Valorant Account API error: ${accountResponse.status}`);
      throw new Error(`Failed to fetch Valorant account: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    const puuid = accountData.puuid;

    // Get match history
    const matchesURL = `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?size=10`;
    
    console.log(`Fetching recent matches for PUUID: ${puuid}`);

    const matchesResponse = await fetch(matchesURL, {
      method: "GET",
      headers: {
        "X-Riot-Token": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "Xbox-Gaming-Platform/1.0"
      },
    });

    if (!matchesResponse.ok) {
      console.error(`Valorant Matches API error: ${matchesResponse.status}`);
      throw new Error(`Failed to fetch Valorant matches: ${matchesResponse.status}`);
    }

    const matchesData = await matchesResponse.json();
    
    // Initialize Supabase client for logging
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Process recent matches for stats
    const recentMatches = matchesData?.history || [];
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCombatScore = 0;
    let matchesWon = 0;
    let totalRounds = 0;

    // Get detailed match data for recent matches (limit to 5 for performance)
    const detailedMatches = [];
    for (const match of recentMatches.slice(0, 5)) {
      try {
        const matchDetailURL = `https://${region}.api.riotgames.com/val/match/v1/matches/${match.matchId}`;
        const matchDetailResponse = await fetch(matchDetailURL, {
          headers: { "X-Riot-Token": apiKey }
        });
        
        if (matchDetailResponse.ok) {
          const matchDetail = await matchDetailResponse.json();
          detailedMatches.push(matchDetail);
          
          // Find player's stats in this match
          const playerStats = matchDetail.players?.find((p: any) => p.puuid === puuid);
          if (playerStats) {
            totalKills += playerStats.stats?.kills || 0;
            totalDeaths += playerStats.stats?.deaths || 0;
            totalAssists += playerStats.stats?.assists || 0;
            totalCombatScore += playerStats.stats?.score || 0;
            totalRounds++;
            
            // Check if player's team won
            const playerTeam = playerStats.teamId;
            const winningTeam = matchDetail.teams?.find((t: any) => t.won)?.teamId;
            if (playerTeam === winningTeam) {
              matchesWon++;
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch match detail for ${match.matchId}:`, error);
      }
    }

    const matchStats = {
      riotName: `${riotName}#${tagLine}`,
      puuid,
      region,
      recentMatches: detailedMatches.length,
      totalKills,
      totalDeaths,
      totalAssists,
      kdRatio: totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills,
      averageCombatScore: detailedMatches.length > 0 ? (totalCombatScore / detailedMatches.length) : 0,
      winRate: detailedMatches.length > 0 ? (matchesWon / detailedMatches.length) * 100 : 0,
      matchesWon,
      lastUpdated: new Date().toISOString()
    };

    // Log the stat fetch for automation tracking
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "valorant_api",
        action_type: "api_call",
        success: true,
        action_data: {
          riotName: matchStats.riotName,
          region,
          recentMatches: matchStats.recentMatches,
          kdRatio: matchStats.kdRatio,
          averageCombatScore: matchStats.averageCombatScore,
          winRate: matchStats.winRate
        }
      });

    console.log(`Successfully fetched Valorant stats for ${riotName}#${tagLine}: ${matchStats.recentMatches} matches analyzed`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        account: accountData,
        matches: detailedMatches,
        stats: matchStats,
        summary: {
          totalMatches: detailedMatches.length,
          avgKills: detailedMatches.length > 0 ? (totalKills / detailedMatches.length) : 0,
          avgDeaths: detailedMatches.length > 0 ? (totalDeaths / detailedMatches.length) : 0,
          avgAssists: detailedMatches.length > 0 ? (totalAssists / detailedMatches.length) : 0
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching Valorant data:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to fetch Valorant data",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});