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
    const { gamertag, platform = "PC" } = await req.json();
    
    if (!gamertag) {
      return new Response(JSON.stringify({ 
        error: "Missing gamertag parameter" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get API key from environment
    const apiKey = Deno.env.get("APEX_LEGENDS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: "Apex Legends API key not configured" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encodedTag = encodeURIComponent(gamertag);
    
    // Use Mozambique Here API (community API for Apex Legends)
    const apiURL = `https://api.mozambiquehe.re/bridge?version=5&platform=${platform}&player=${encodedTag}&auth=${apiKey}`;
    
    console.log(`Fetching Apex Legends stats for ${gamertag} on platform ${platform}`);

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Xbox-Gaming-Platform/1.0"
      },
    });

    if (!response.ok) {
      console.error(`Apex Legends API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch Apex Legends data: ${response.status}`);
    }

    const data = await response.json();
    
    // Initialize Supabase client for logging
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract key stats for easier access
    const global = data?.global || {};
    const legends = data?.legends || {};
    
    const matchStats = {
      gamertag,
      platform,
      level: global.level || 0,
      kills: global.kills?.value || 0,
      damage: global.damage?.value || 0,
      wins: global.wins?.value || 0,
      matches: global.matches_played?.value || 0,
      headshots: global.headshots?.value || 0,
      revives: global.revives?.value || 0,
      currentRank: data?.global?.rank?.rankName || "Unranked",
      activeLegend: legends?.selected?.LegendName || "Unknown",
      lastUpdated: new Date().toISOString()
    };

    // Log the stat fetch for automation tracking
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "apex_legends_api",
        action_type: "api_call",
        success: true,
        action_data: {
          gamertag,
          platform,
          level: matchStats.level,
          kills: matchStats.kills,
          matches: matchStats.matches,
          currentRank: matchStats.currentRank
        }
      });

    console.log(`Successfully fetched Apex Legends stats for ${gamertag}: Level ${matchStats.level}, Kills ${matchStats.kills}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        raw: data,
        stats: matchStats,
        profile: {
          global: data?.global,
          legends: data?.legends,
          metadata: data?.ALS
        }
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching Apex Legends data:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to fetch Apex Legends data",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});