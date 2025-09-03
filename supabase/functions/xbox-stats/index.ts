import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const apiKey = Deno.env.get('XBOX_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing Xbox API key" }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const response = await fetch("https://xboxapi.com/stats", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Xbox API error: ${response.statusText}` }), 
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log("Xbox API response:", data);

    return new Response(
      JSON.stringify({ status: "success", data }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    clearTimeout(timeout);
    console.error("Function error:", err.message);
    return new Response(
      JSON.stringify({ error: "Function error: " + err.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});