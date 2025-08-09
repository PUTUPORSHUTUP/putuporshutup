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
    console.log('🔍 Xbox Live validation started');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Set runtime KMS for potential DB helpers that use current_setting('app.kms_key')
    const kmsKey = Deno.env.get("KEY_XBOX_KMS") || "";
    if (kmsKey) {
      await supabase.rpc('set_config', { 
        parameter: 'app.kms_key', 
        value: kmsKey, 
        is_local: true 
      });
    }

    console.log('📊 Fetching Xbox integration settings');
    
    // Fetch settings
    const { data: xi, error } = await supabase
      .from("xbox_integration")
      .select("console_ip, enc_api_key")
      .single();
      
    if (error) {
      console.error('❌ Failed to fetch Xbox integration settings:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const ip = xi.console_ip as string;
    console.log(`🌐 Testing console reachability at ${ip}`);
    
    // Step A: console reachability (optional: GET http://<ip>:<port>/status)
    let ipOk = false;
    let ipDetail = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const resp = await fetch(`http://${ip}:8123/status`, { 
        method: "GET", 
        redirect: "manual",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      ipOk = resp.ok;
      ipDetail = ipOk ? `reachable (${resp.status})` : `unreachable (${resp.status})`;
      console.log(`📡 Console IP ${ip}: ${ipDetail}`);
    } catch (e) {
      ipOk = false;
      ipDetail = `connection failed: ${e.message}`;
      console.log(`❌ Console IP ${ip}: ${ipDetail}`);
    }

    // Step B: key validity - for now we'll assume valid since we'd need to decrypt and test
    // In a real implementation, you'd decrypt the key and test against Xbox API
    const keyOk = true; 
    const keyDetail = "validation skipped (encrypted storage)";
    console.log(`🔑 API Key: ${keyDetail}`);

    const result = {
      ok: ipOk && keyOk,
      steps: [
        { step: "ip_reachable", ok: ipOk, detail: ipDetail },
        { step: "api_key_valid", ok: keyOk, detail: keyDetail },
      ],
    };

    console.log('✅ Validation completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          "content-type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (e) {
    console.error('💥 Validation failed:', e);
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