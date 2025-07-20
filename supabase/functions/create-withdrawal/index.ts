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

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Get request body
    const { amount } = await req.json();
    
    if (!amount || amount < 10) {
      throw new Error("Minimum withdrawal amount is $10");
    }

    console.log("Processing withdrawal for user:", user.email, "amount:", amount);

    // Use service role to access database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check user's wallet balance
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.wallet_balance < amount) {
      throw new Error("Insufficient funds for withdrawal");
    }

    // Get customer from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found. Please make a deposit first.");
    }

    const customerId = customers.data[0].id;

    // For test mode, we'll create a withdrawal request that requires manual processing
    // In production, you'd use Stripe Connect for instant transfers
    
    // Create withdrawal transaction record
    const { data: transaction } = await supabaseService
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        amount: amount,
        status: "pending",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Deduct from wallet balance
    await supabaseService
      .from("profiles")
      .update({
        wallet_balance: profile.wallet_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    console.log("Withdrawal request created:", transaction?.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Withdrawal request submitted. Funds will be processed within 1-3 business days.",
      transaction_id: transaction?.id,
      amount: amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Withdrawal error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Withdrawal processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});