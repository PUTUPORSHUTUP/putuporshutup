import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with live secret key for real payments
    const stripe = new Stripe(Deno.env.get("STRIPE_LIVE_SECRET_KEY") || "", {
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

    console.log("Creating premium subscription for user:", user.email);

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

    // Check if user already has an active subscription
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: existingSubscription } = await supabaseService
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      throw new Error("User already has an active premium subscription");
    }

    // Get or create Stripe Price for VIP Monthly ($9.99 with 7-day trial)
    let priceId;
    
    try {
      // Try to find existing price by lookup key
      const prices = await stripe.prices.list({ lookup_keys: ["vip_monthly"], limit: 1 });
      
      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
        console.log("Using existing price:", priceId);
      } else {
        // Create price if it doesn't exist
        const price = await stripe.prices.create({
          unit_amount: 999, // $9.99
          currency: "usd",
          recurring: { interval: "month" },
          product_data: {
            name: "VIP Membership"
          },
          lookup_key: "vip_monthly",
        });
        priceId = price.id;
        console.log("Created new price:", priceId);
      }
    } catch (error) {
      console.error("Error handling price:", error);
      throw new Error("Failed to create or retrieve subscription price");
    }

    // Create subscription session with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          plan: "vip_monthly"
        }
      },
      success_url: `${req.headers.get("origin")}/profile?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/profile?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        plan: "vip_monthly"
      }
    });

    console.log("Subscription session created:", session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Premium subscription error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Subscription creation failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});