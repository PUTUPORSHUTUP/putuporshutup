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
    const { gamertag, platform = "xbl" } = await req.json();
    
    if (!gamertag) {
      return new Response(JSON.stringify({ 
        error: "Missing gamertag parameter" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get API key from environment
    const apiKey = Deno.env.get("COD_TRACKER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "COD Tracker API key not configured" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encodedTag = encodeURIComponent(gamertag);
    
    // Use COD Tracker API (replace with actual endpoint)
    const apiURL = `https://api.tracker.gg/api/v2/warzone/standard/profile/${platform}/${encodedTag}`;
    
    console.log(`Fetching COD stats for ${gamertag} on platform ${platform}`);

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "TRN-Api-Key": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "Xbox-Gaming-Platform/1.0"
      },
    });

    if (!response.ok) {
      console.error(`COD API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch Call of Duty data: ${response.status}`);
    }

    const data = await response.json();
    
    // Initialize Supabase client for logging
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract key stats for easier access
    const stats = data?.data?.segments?.[0]?.stats || {};
    const matchStats = {
      gamertag,
      platform,
      kills: stats.kills?.value || 0,
      deaths: stats.deaths?.value || 0,
      kdRatio: stats.kdRatio?.value || 0,
      wins: stats.wins?.value || 0,
      matches: stats.matchesPlayed?.value || 0,
      winRate: stats.wlRatio?.value || 0,
      damage: stats.damage?.value || 0,
      score: stats.score?.value || 0,
      timePlayed: stats.timePlayed?.value || 0,
      lastUpdated: new Date().toISOString()
    };

    // Log the stat fetch for automation tracking
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "cod_stat_fetch",
        action_type: "api_call",
        success: true,
        action_data: {
          gamertag,
          platform,
          statsRetrieved: Object.keys(stats).length,
          kdRatio: matchStats.kdRatio,
          matches: matchStats.matches
        }
      });

    console.log(`Successfully fetched COD stats for ${gamertag}: K/D ${matchStats.kdRatio}, Matches ${matchStats.matches}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        raw: data,
        stats: matchStats,
        profile: {
          platformInfo: data?.data?.platformInfo,
          userInfo: data?.data?.userInfo,
          metadata: data?.data?.metadata
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching COD data:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to fetch Call of Duty data",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});