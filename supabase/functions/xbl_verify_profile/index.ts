import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎮 Xbox profile verification started');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { gamertag } = body;

    if (!gamertag || typeof gamertag !== 'string') {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid gamertag provided" }),
        { 
          status: 400,
          headers: { 
            "content-type": "application/json",
            ...corsHeaders 
          }
        }
      );
    }

    const normalizedGamertag = gamertag.trim();
    console.log(`🔍 Verifying profile for: ${normalizedGamertag}`);

    // Get Xbox API configuration
    const { data: config, error: configError } = await supabase
      .from("api_configurations")
      .select("config_value")
      .eq("config_key", "XBOX_API_KEY")
      .single();

    if (configError || !config) {
      console.error('❌ Xbox API key not configured:', configError);
      return new Response(
        JSON.stringify({ ok: false, error: "Xbox API not configured" }),
        { 
          status: 500,
          headers: { 
            "content-type": "application/json",
            ...corsHeaders 
          }
        }
      );
    }

    const apiKey = config.config_value;
    
    try {
      console.log(`📡 Calling Xbox API for gamertag: ${normalizedGamertag}`);
      
      // Call Xbox API to verify profile
      const response = await fetch(`https://xboxapi.com/v2/profile/gamertag/${encodeURIComponent(normalizedGamertag)}`, {
        headers: {
          'X-Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Xbox API error: ${response.status} - ${errorText}`);
        
        if (response.status === 404) {
          return new Response(
            JSON.stringify({ ok: false, error: "Gamertag not found" }),
            { 
              headers: { 
                "content-type": "application/json",
                ...corsHeaders 
              }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ ok: false, error: `Xbox API error: ${response.status}` }),
          { 
            status: 500,
            headers: { 
              "content-type": "application/json",
              ...corsHeaders 
            }
          }
        );
      }

      const profileData = await response.json();
      console.log('✅ Xbox API response received');
      
      // Extract XUID and verified gamertag
      const xuid = profileData.xuid || profileData.id;
      const verifiedGamertag = profileData.gamertag || profileData.displayName;

      if (!xuid) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid profile data from Xbox API" }),
          { 
            headers: { 
              "content-type": "application/json",
              ...corsHeaders 
            }
          }
        );
      }

      console.log(`✅ Profile verified - XUID: ${xuid}, Gamertag: ${verifiedGamertag}`);

      // Log the verification attempt
      await supabase.from('automated_actions').insert({
        automation_type: 'xbox_verification',
        action_type: 'profile_verify',
        target_id: xuid,
        action_data: {
          gamertag: verifiedGamertag,
          xuid: xuid,
          verification_time: new Date().toISOString()
        },
        success: true
      });

      return new Response(
        JSON.stringify({ 
          ok: true, 
          xuid: xuid,
          gamertag: verifiedGamertag 
        }),
        { 
          headers: { 
            "content-type": "application/json",
            ...corsHeaders 
          }
        }
      );

    } catch (apiError) {
      console.error('💥 Xbox API call failed:', apiError);
      
      // Log the failed verification attempt
      await supabase.from('automated_actions').insert({
        automation_type: 'xbox_verification',
        action_type: 'profile_verify',
        action_data: {
          gamertag: normalizedGamertag,
          error: String(apiError)
        },
        success: false,
        error_message: String(apiError)
      });

      return new Response(
        JSON.stringify({ ok: false, error: "Failed to verify profile with Xbox API" }),
        { 
          headers: { 
            "content-type": "application/json",
            ...corsHeaders 
          }
        }
      );
    }

  } catch (e) {
    console.error('💥 Profile verification failed:', e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 500,
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
});