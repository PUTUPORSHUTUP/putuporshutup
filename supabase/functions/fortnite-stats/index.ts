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
    const { epicName, accountType = "epic" } = await req.json();
    
    if (!epicName) {
      return new Response(JSON.stringify({ 
        error: "Missing Epic Games username parameter" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get API key from environment
    const apiKey = Deno.env.get("FORTNITE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Fortnite API key not configured" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encodedName = encodeURIComponent(epicName);
    
    // Use Fortnite-API.com for comprehensive stats
    const apiURL = `https://fortnite-api.com/v2/stats/br/v2?name=${encodedName}&accountType=${accountType}`;
    
    console.log(`Fetching Fortnite stats for ${epicName} (${accountType})`);

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "Xbox-Gaming-Platform/1.0"
      },
    });

    if (!response.ok) {
      console.error(`Fortnite API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch Fortnite data: ${response.status}`);
    }

    const data = await response.json();
    
    // Initialize Supabase client for logging
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract stats from different game modes
    const overallStats = data?.data?.stats?.all?.overall || {};
    const soloStats = data?.data?.stats?.all?.solo || {};
    const duoStats = data?.data?.stats?.all?.duo || {};
    const squadStats = data?.data?.stats?.all?.squad || {};

    const matchStats = {
      epicName,
      accountType,
      // Overall stats
      totalWins: overallStats.wins || 0,
      totalKills: overallStats.kills || 0,
      totalMatches: overallStats.matches || 0,
      totalDeaths: overallStats.deaths || 0,
      kdRatio: overallStats.kd || 0,
      winRate: overallStats.winRate || 0,
      totalScore: overallStats.score || 0,
      totalTimePlayed: overallStats.minutesPlayed || 0,
      // Solo mode
      soloWins: soloStats.wins || 0,
      soloKills: soloStats.kills || 0,
      soloMatches: soloStats.matches || 0,
      soloTop10: soloStats.top10 || 0,
      // Duo mode
      duoWins: duoStats.wins || 0,
      duoKills: duoStats.kills || 0,
      duoMatches: duoStats.matches || 0,
      duoTop5: duoStats.top5 || 0,
      // Squad mode
      squadWins: squadStats.wins || 0,
      squadKills: squadStats.kills || 0,
      squadMatches: squadStats.matches || 0,
      squadTop3: squadStats.top3 || 0,
      lastUpdated: new Date().toISOString()
    };

    // Log the stat fetch for automation tracking
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "fortnite_api",
        action_type: "api_call",
        success: true,
        action_data: {
          epicName,
          accountType,
          totalWins: matchStats.totalWins,
          totalKills: matchStats.totalKills,
          totalMatches: matchStats.totalMatches,
          kdRatio: matchStats.kdRatio,
          winRate: matchStats.winRate
        }
      });

    console.log(`Successfully fetched Fortnite stats for ${epicName}: ${matchStats.totalWins} wins, ${matchStats.totalKills} kills`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        raw: data,
        stats: matchStats,
        profile: {
          account: data?.data?.account,
          battlePass: data?.data?.battlePass,
          image: data?.data?.image
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching Fortnite data:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to fetch Fortnite data",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});