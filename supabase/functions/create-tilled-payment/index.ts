import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CHARGE ENTRY FEE — SANDBOX TEST MODE
const chargeEntryFee = async ({ amountInCents, paymentMethodId, userId, challengeId }) => {
  const TILLED_SECRET_KEY = Deno.env.get("TILLED_SECRET_KEY");
  
  const response = await fetch('https://api-sandbox.tilled.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TILLED_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInCents,        // Example: 1000 = $10.00
      currency: 'usd',
      payment_method: paymentMethodId,  // From Tilled Elements (card form)
      capture: true,
      metadata: {
        user_id: userId,
        challenge_id: challengeId
      }
    })
  });

  const data = await response.json();
  return data;
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
    const { amount, totalCharge, platformFee, challengeId, type = "wallet_deposit" } = await req.json();
    
    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }

    if (!totalCharge || totalCharge < amount) {
      throw new Error("Invalid total charge");
    }

    // Convert to cents for Tilled (use totalCharge which includes platform fee)
    const amountInCents = Math.round(totalCharge * 100);

    // Use mock payment method for sandbox testing
    const mockPaymentMethodId = 'pm_test_card_visa'; // Tilled's sandbox test card

    console.log("Charging entry fee:", {
      amountInCents,
      userId: user.id,
      challengeId: challengeId || 'wallet_deposit',
      paymentMethodId: mockPaymentMethodId
    });

    // Charge entry fee using the exact function from your ChatGPT conversation
    const chargeResult = await chargeEntryFee({
      amountInCents,
      paymentMethodId: mockPaymentMethodId,
      userId: user.id,
      challengeId: challengeId || 'wallet_deposit'
    });

    console.log("Tilled charge result:", chargeResult);

    if (chargeResult.error) {
      throw new Error(`Tilled charge failed: ${chargeResult.error.message || 'Unknown error'}`);
    }

    // Log transaction using Supabase service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: transactionError } = await supabaseService.from("transactions").insert({
      user_id: user.id,
      type: type,
      amount: amount,
      status: chargeResult.status === 'succeeded' ? 'completed' : 'pending',
      stripe_payment_intent: chargeResult.id, // Using same field for Tilled charge ID
      description: `${type === 'challenge_entry' ? 'Challenge Entry Fee' : 'Wallet Deposit'} - Tilled Sandbox`,
      created_at: new Date().toISOString()
    });

    if (transactionError) {
      console.error("Transaction logging error:", transactionError);
    }

    // If charge succeeded and it's a wallet deposit, update wallet balance
    // For challenge entries, funds are held in escrow
    if (chargeResult.status === 'succeeded' && type === 'wallet_deposit') {
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

    // TODO: More endpoints (payouts, webhooks) coming next
    
    return new Response(JSON.stringify({ 
      success: true,
      charge: chargeResult,
      amount: amount,
      totalCharge: totalCharge,
      type: type,
      escrowHold: type === 'challenge_entry' ? true : false
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