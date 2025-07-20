import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

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

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get session ID from request
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID required");
    }

    console.log("Verifying payment session:", session_id);

    // Get session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Use service role to update database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if already processed
    const { data: existingTransaction } = await supabaseService
      .from("transactions")
      .select("*")
      .eq("stripe_session_id", session_id)
      .single();

    if (existingTransaction?.status === "completed") {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const amount = parseFloat(session.metadata?.amount || "0");
    
    if (amount <= 0) {
      throw new Error("Invalid amount in session metadata");
    }

    console.log("Processing payment completion for amount:", amount);

    // Update transaction status
    await supabaseService
      .from("transactions")
      .update({
        status: "completed",
        stripe_payment_intent: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq("stripe_session_id", session_id);

    // Update user's wallet balance
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    const newBalance = (profile?.wallet_balance || 0) + amount;

    await supabaseService
      .from("profiles")
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    console.log("Payment verified and wallet updated:", newBalance);

    return new Response(JSON.stringify({ 
      success: true, 
      amount: amount,
      new_balance: newBalance 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Payment verification failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});