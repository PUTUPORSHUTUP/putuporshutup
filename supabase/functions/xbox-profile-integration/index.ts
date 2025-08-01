import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PUOSU Xbox Live Integration Configuration
const PUOSU_XBOX_CONFIG = {
  titleId: "2140035565",
  scid: "00000000-0000-0000-0000-00007f8e521d",
  sandboxId: "BTWDGW.158"
};

interface XboxProfile {
  gamertag: string;
  xuid: string;
  profilePictureUrl: string;
  gamerScore: number;
  accountTier: string;
  isPublic: boolean;
}

interface XboxMatchData {
  matchId: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  placement: number;
  gameMode: string;
  matchDuration: number;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, gamertag, xuid } = await req.json();
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get Xbox API key from database with fallback to environment
    const xboxApiKey = await getXboxAPIKey(supabaseService);

    console.log(`Processing Xbox action: ${action}`);

    switch (action) {
      case "lookup_gamertag":
        return await lookupGamertag(gamertag, xboxApiKey, supabaseService);
      
      case "link_profile":
        return await linkXboxProfile(gamertag, xuid, req, supabaseService, xboxApiKey);
      
      case "get_profile":
        return await getXboxProfile(xuid, xboxApiKey);
      
      case "verify_gamertag":
        return await verifyGamertag(gamertag, xboxApiKey);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error("Error in Xbox integration:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to process Xbox request",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Helper function to get Xbox API key from database or environment
async function getXboxAPIKey(supabase: any): Promise<string | null> {
  try {
    // First try to get from database
    const { data: config, error } = await supabase
      .from('api_configurations')
      .select('config_value')
      .eq('config_key', 'XBOX_API_KEY')
      .single();
    
    if (!error && config?.config_value) {
      console.log('Using Xbox API key from database');
      return config.config_value;
    }
  } catch (dbError) {
    console.log('Database API key lookup failed, falling back to environment variable');
  }
  
  // Fallback to environment variable
  const envKey = Deno.env.get('XBOX_API_KEY');
  if (envKey) {
    console.log('Using Xbox API key from environment variable');
    return envKey;
  }
  
  console.log('No Xbox API key found in database or environment');
  return null;
}

async function lookupGamertag(gamertag: string, apiKey: string, supabase: any) {
  console.log(`Looking up gamertag: ${gamertag} using XUID.io`);
  
  try {
    // Use XUID.io - more reliable and doesn't require API key
    const response = await fetch(`https://xuid.io/lookup/${encodeURIComponent(gamertag)}`);
    
    console.log(`XUID.io response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`XUID.io error: ${response.status} ${response.statusText}, Body: ${errorText}`);
      
      if (response.status === 404) {
        return new Response(JSON.stringify({
          success: false,
          error: "Gamertag not found"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      
      throw new Error(`XUID.io error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`XUID.io response:`, data);
    
    if (!data.xuid) {
      return new Response(JSON.stringify({
        success: false,
        error: "Gamertag not found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      profile: {
        gamertag: data.gamertag || gamertag,
        xuid: data.xuid,
        profilePictureUrl: data.avatar || `https://avatar-ssl.xboxlive.com/avatar/${gamertag}/avatar-body.png`,
        gamerScore: data.gamerscore || 0,
        isPublic: true
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('XUID.io lookup failed:', error);
    throw error;
  }
}

async function linkXboxProfile(gamertag: string, xuid: string, req: Request, supabase: any, apiKey: string) {
  // Get user from auth header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error("Authentication required");
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error("Invalid authentication");
  }

  // Verify the Xbox profile exists
  const profileResponse = await fetch(`https://xboxapi.com/v2/profile/${xuid}`, {
    headers: {
      "X-AUTH": apiKey,
      "Content-Type": "application/json"
    }
  });

  if (!profileResponse.ok) {
    throw new Error("Xbox profile verification failed");
  }

  const xboxProfile = await profileResponse.json();

  // Check if Xbox profile is already linked to another user
  const { data: existingLink } = await supabase
    .from("profiles")
    .select("user_id, xbox_gamertag")
    .eq("xbox_xuid", xuid)
    .neq("user_id", user.id)
    .single();

  if (existingLink) {
    return new Response(JSON.stringify({
      success: false,
      error: "This Xbox profile is already linked to another account"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 409,
    });
  }

  // Update user profile with Xbox information
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xbox_gamertag: xboxProfile.gamertag,
      xbox_xuid: xuid,
      xbox_profile_picture: xboxProfile.gamerpic,
      xbox_gamer_score: xboxProfile.gamescore,
      xbox_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`Failed to link Xbox profile: ${updateError.message}`);
  }

  // Log the successful linking
  await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      activity_type: "xbox_profile_linked",
      title: "Xbox Profile Linked",
      description: `Successfully linked Xbox gamertag: ${xboxProfile.gamertag}`,
      metadata: {
        gamertag: xboxProfile.gamertag,
        xuid: xuid,
        gamerScore: xboxProfile.gamescore
      }
    });

  return new Response(JSON.stringify({
    success: true,
    message: "Xbox profile linked successfully",
    profile: {
      gamertag: xboxProfile.gamertag,
      xuid: xuid,
      gamerScore: xboxProfile.gamescore,
      profilePictureUrl: xboxProfile.gamerpic
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getXboxProfile(xuid: string, apiKey: string) {
  const response = await fetch(`https://xboxapi.com/v2/profile/${xuid}`, {
    headers: {
      "X-AUTH": apiKey,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Xbox profile: ${response.status}`);
  }

  const profile = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    profile: {
      gamertag: profile.gamertag,
      xuid: xuid,
      profilePictureUrl: profile.gamerpic,
      gamerScore: profile.gamescore,
      accountTier: "Gold" // Xbox API doesn't return tier info
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function verifyGamertag(gamertag: string, apiKey: string) {
  const response = await fetch(`https://xboxapi.com/v2/xuid/${encodeURIComponent(gamertag)}`, {
    headers: {
      "X-AUTH": apiKey,
      "Content-Type": "application/json"
    }
  });

  const xuid = await response.text();
  const isValid = response.ok && xuid && xuid !== "null";
  
  return new Response(JSON.stringify({
    success: true,
    isValid,
    gamertag: isValid ? gamertag : null
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}