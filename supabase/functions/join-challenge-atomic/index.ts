import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { attempts: number; lastAttempt: number }>();

const isRateLimited = (userId: string): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit) {
    rateLimitMap.set(userId, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Reset if more than 5 minutes passed
  if (now - userLimit.lastAttempt > 5 * 60 * 1000) {
    rateLimitMap.set(userId, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Check if exceeded limit
  if (userLimit.attempts >= 10) {
    return true;
  }
  
  // Increment attempts
  userLimit.attempts++;
  userLimit.lastAttempt = now;
  return false;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token for authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: "Unauthorized: Missing or invalid authorization header" 
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { challengeId, userId, stakeAmount } = await req.json();

    // Enhanced input validation
    if (!challengeId || !userId || !stakeAmount) {
      return new Response(JSON.stringify({ 
        error: "challengeId, userId, and stakeAmount required" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(challengeId) || !uuidRegex.test(userId)) {
      return new Response(JSON.stringify({ 
        error: "Invalid UUID format" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate stake amount
    if (typeof stakeAmount !== 'number' || stakeAmount <= 0 || stakeAmount > 10000) {
      return new Response(JSON.stringify({ 
        error: "Invalid stake amount: must be between 0 and 10000" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check rate limiting
    if (isRateLimited(userId)) {
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded: too many attempts" 
      }), { 
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, { 
      auth: { persistSession: false } 
    });

    // Verify the user exists and extract user from JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user || user.id !== userId) {
      console.error("Authentication error:", authError);
      return new Response(JSON.stringify({ 
        error: "Unauthorized: Invalid user token" 
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing challenge join request - User: ${userId}, Challenge: ${challengeId}, Stake: ${stakeAmount}`);

    // Call the secure atomic join function
    const { error } = await supabase.rpc('join_challenge_atomic', {
      p_challenge_id: challengeId,
      p_user_id: userId,
      p_stake_amount: stakeAmount
    });

    if (error) {
      console.error("Join challenge atomic error:", error);
      
      // Map database errors to user-friendly messages
      let userMessage = "Failed to join challenge";
      switch (error.message) {
        case 'insufficient_balance':
          userMessage = "Insufficient wallet balance to join this challenge";
          break;
        case 'already_joined':
          userMessage = "You have already joined this challenge";
          break;
        case 'challenge_not_available':
          userMessage = "This challenge is no longer available";
          break;
        case 'challenge_full':
          userMessage = "This challenge is full";
          break;
        case 'rate_limit_exceeded':
          userMessage = "Too many attempts. Please try again later";
          break;
        case 'invalid_parameters':
        case 'invalid_stake_amount':
          userMessage = "Invalid request parameters";
          break;
        default:
          userMessage = "Unable to join challenge at this time";
      }
      
      return new Response(JSON.stringify({ 
        error: userMessage,
        code: error.message
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully joined challenge - User: ${userId}, Challenge: ${challengeId}`);

    return new Response(JSON.stringify({ 
      ok: true,
      message: "Successfully joined challenge and debited wallet"
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in join-challenge-atomic:", error);
    
    // Don't expose internal error details to client
    return new Response(JSON.stringify({ 
      error: "Internal server error"
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});