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
    const { gamertag } = await req.json();
    
    if (!gamertag) {
      return new Response(JSON.stringify({ 
        error: "Missing gamertag parameter" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get session cookie from environment
    const sessionCookie = Deno.env.get("COD_SESSION_COOKIE");
    if (!sessionCookie) {
      return new Response(JSON.stringify({ 
        error: "COD session cookie not configured" 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const encodedTag = encodeURIComponent(gamertag);
    const platform = "xbl"; // Xbox Live platform ID

    const apiURL = `https://my.cod.tracker.api/cod/v1/title/mw/platform/${platform}/gamer/${encodedTag}/matches`;
    
    console.log(`Fetching COD latest match for ${gamertag} on platform ${platform}`);

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `ACT_SSO_COOKIE=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      console.error(`COD API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch Call of Duty data: ${response.status}`);
    }

    const data = await response.json();
    const latestMatch = data?.matches?.[0];

    if (!latestMatch) {
      return new Response(JSON.stringify({
        error: "No matches found for this gamertag"
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client for logging
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const matchStats = {
      gamertag,
      platform,
      mode: latestMatch?.mode,
      kills: latestMatch?.playerStats?.kills || 0,
      deaths: latestMatch?.playerStats?.deaths || 0,
      kdRatio: latestMatch?.playerStats?.kdRatio || 0,
      matchDate: latestMatch?.utcStartSeconds,
      lastUpdated: new Date().toISOString()
    };

    // Log the stat fetch for automation tracking
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "cod_latest_match",
        action_type: "api_call",
        success: true,
        action_data: {
          gamertag,
          platform,
          mode: matchStats.mode,
          kills: matchStats.kills,
          deaths: matchStats.deaths,
          kdRatio: matchStats.kdRatio
        }
      });

    console.log(`Successfully fetched COD latest match for ${gamertag}: ${matchStats.mode}, K/D ${matchStats.kdRatio}`);

    return new Response(JSON.stringify({
      success: true,
      data: matchStats
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching COD latest match:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to fetch Call of Duty latest match",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});