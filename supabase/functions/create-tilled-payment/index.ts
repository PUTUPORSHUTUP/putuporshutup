import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Tilled secret key
    const tilledSecretKey = Deno.env.get("TILLED_SECRET_KEY");
    console.log("Tilled key found:", tilledSecretKey ? "YES" : "NO");
    
    if (!tilledSecretKey) {
      throw new Error("TILLED_SECRET_KEY not found");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    console.log("Processing Tilled payment for user:", user.email);

    // Get request body
    const { amount, totalCharge, platformFee, paymentMethodId, challengeId, type = "wallet_deposit" } = await req.json();
    
    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }

    if (!totalCharge || totalCharge < amount) {
      throw new Error("Invalid total charge");
    }

    // Convert to cents for Tilled
    const amountInCents = Math.round(totalCharge * 100);

    console.log("Charging amount in cents:", amountInCents);

    // Charge entry fee using Tilled API
    const chargeResponse = await fetch('https://api-sandbox.tilled.com/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tilledSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: 'usd',
        payment_method: paymentMethodId,
        capture: true,
        metadata: {
          user_id: user.id,
          challenge_id: challengeId || 'wallet_deposit',
          type: type,
          original_amount: amount.toString(),
          platform_fee: (platformFee || 0).toString()
        }
      })
    });

    const chargeData = await chargeResponse.json();
    console.log("Tilled charge response:", chargeData);

    if (!chargeResponse.ok) {
      throw new Error(`Tilled charge failed: ${chargeData.message || 'Unknown error'}`);
    }

    // Log transaction
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: transactionError } = await supabaseService.from("transactions").insert({
      user_id: user.id,
      type: type,
      amount: amount,
      status: chargeData.status === 'succeeded' ? 'completed' : 'pending',
      stripe_payment_intent: chargeData.id, // Using same field for Tilled charge ID
      created_at: new Date().toISOString()
    });

    if (transactionError) {
      console.error("Transaction logging error:", transactionError);
    }

    // If charge succeeded and it's a wallet deposit, update wallet balance
    if (chargeData.status === 'succeeded' && type === 'wallet_deposit') {
      const { error: balanceError } = await supabaseService
        .from("profiles")
        .update({ 
          wallet_balance: supabaseService.raw(`wallet_balance + ${amount}`)
        })
        .eq("user_id", user.id);

      if (balanceError) {
        console.error("Balance update error:", balanceError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      charge: chargeData,
      amount: amount,
      totalCharge: totalCharge
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Tilled payment error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Payment processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});