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

// PAYOUT TO WINNER — TILLED SANDBOX
const releaseTilledPayout = async ({ amountInCents, destinationAccountId, challengeId }) => {
  const TILLED_SECRET_KEY = Deno.env.get("TILLED_SECRET_KEY");
  
  const response = await fetch('https://api-sandbox.tilled.com/v1/transfers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TILLED_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInCents,            // Ex: 940 = $9.40 payout after 6% fee
      currency: 'usd',
      destination: destinationAccountId,  // Tilled connected account of winner
      metadata: {
        challenge_id: challengeId,
        payout_reason: 'winner'
      }
    })
  });

  const data = await response.json();
  return data;
};

// REFUND ENTRY FEE — TILLED SANDBOX
const refundTilledCharge = async ({ chargeId, reason = "match_canceled" }) => {
  const TILLED_SECRET_KEY = Deno.env.get("TILLED_SECRET_KEY");
  
  const response = await fetch(`https://api-sandbox.tilled.com/v1/charges/${chargeId}/refunds`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TILLED_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason, // Optional: "requested_by_customer", "duplicate", "fraudulent", etc.
      metadata: {
        refund_reason: reason
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
    const { amount, totalCharge, platformFee, challengeId, type = "wallet_deposit", destinationAccountId, chargeId, reason } = await req.json();
    
    // Handle refund requests
    if (type === 'refund') {
      if (!chargeId) {
        throw new Error("Charge ID required for refunds");
      }
      
      console.log("Processing Tilled refund:", {
        chargeId,
        reason: reason || "match_canceled"
      });

      // Process refund using Tilled
      const refundResult = await refundTilledCharge({
        chargeId,
        reason: reason || "match_canceled"
      });

      console.log("Tilled refund result:", refundResult);

      if (refundResult.error) {
        throw new Error(`Tilled refund failed: ${refundResult.error.message || 'Unknown error'}`);
      }

      // Log refund transaction
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { error: transactionError } = await supabaseService.from("transactions").insert({
        user_id: user.id,
        type: 'refund',
        amount: -(refundResult.amount / 100), // Convert back to dollars and make negative
        status: refundResult.status === 'succeeded' ? 'completed' : 'pending',
        stripe_payment_intent: refundResult.id, // Using same field for Tilled refund ID
        description: `Match Refund - ${reason || "match_canceled"} - Tilled Sandbox`,
        created_at: new Date().toISOString()
      });

      if (transactionError) {
        console.error("Refund transaction logging error:", transactionError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        refund: refundResult,
        amount: refundResult.amount / 100,
        type: 'refund',
        reason: reason || "match_canceled"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle payout requests
    if (type === 'payout') {
      if (!amount || amount < 1) {
        throw new Error("Invalid payout amount");
      }
      
      if (!destinationAccountId) {
        throw new Error("Destination account ID required for payouts");
      }
      
      if (!challengeId) {
        throw new Error("Challenge ID required for payouts");
      }

      const amountInCents = Math.round(amount * 100);
      
      console.log("Processing Tilled payout:", {
        amountInCents,
        destinationAccountId,
        challengeId
      });

      // Release payout to winner
      const payoutResult = await releaseTilledPayout({
        amountInCents,
        destinationAccountId,
        challengeId
      });

      console.log("Tilled payout result:", payoutResult);

      if (payoutResult.error) {
        throw new Error(`Tilled payout failed: ${payoutResult.error.message || 'Unknown error'}`);
      }

      // Log payout transaction
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { error: transactionError } = await supabaseService.from("transactions").insert({
        user_id: user.id,
        type: 'payout',
        amount: amount,
        status: payoutResult.status === 'succeeded' ? 'completed' : 'pending',
        stripe_payment_intent: payoutResult.id, // Using same field for Tilled transfer ID
        description: `Challenge Winner Payout - Tilled Sandbox`,
        created_at: new Date().toISOString()
      });

      if (transactionError) {
        console.error("Payout transaction logging error:", transactionError);
      }

      return new Response(JSON.stringify({ 
        success: true,
        payout: payoutResult,
        amount: amount,
        type: 'payout',
        challengeId: challengeId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Handle charge requests (existing logic)
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