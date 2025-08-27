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
    // Initialize services
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

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

    console.log("Processing wallet deposit for user:", user.email);

    // Get request body
    const { amount, description } = await req.json();
    
    if (!amount || amount < 5) {
      throw new Error("Minimum deposit amount is $5");
    }

    if (amount > 10000) {
      throw new Error("Maximum deposit amount is $10,000");
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Check if customer exists, create if not
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    console.log("Customer ID:", customerId);

    // Create payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PUOSU Gaming Wallet Deposit",
              description: description || `Add $${amount} to your gaming wallet`
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/wallet?deposit=success&amount=${amount}`,
      cancel_url: `${req.headers.get("origin")}/wallet?deposit=cancelled`,
      metadata: {
        user_id: user.id,
        amount: amount.toString(),
        type: "wallet_deposit",
        description: description || "Wallet deposit"
      }
    });

    console.log("Payment session created:", session.id);

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create pending transaction record using the existing transactions table
    try {
      const { error: insertError } = await supabaseService.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        status: "pending",
        description: description || "Wallet deposit",
        payment_intent_id: session.id,
        created_at: new Date().toISOString()
      });

      if (insertError) {
        console.error("Error creating transaction record:", insertError);
        // Continue anyway - the webhook will handle the completion
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      // Continue anyway - the webhook will handle the completion
    }

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      amount: amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Wallet deposit error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Deposit processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});