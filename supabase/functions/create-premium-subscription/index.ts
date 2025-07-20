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

    // Create Stripe Price for Premium Monthly ($9.99)
    let priceId = "price_premium_monthly";
    
    try {
      // Try to retrieve existing price
      await stripe.prices.retrieve(priceId);
    } catch (error) {
      // Create price if it doesn't exist
      const price = await stripe.prices.create({
        unit_amount: 999, // $9.99
        currency: "usd",
        recurring: { interval: "month" },
        product_data: {
          name: "Gaming Platform Premium",
          description: "50% off deposit fees, exclusive tournaments, priority support"
        },
        lookup_key: "premium_monthly",
      });
      priceId = price.id;
    }

    // Create subscription session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/profile?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/profile?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        plan: "premium_monthly"
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: "premium_monthly"
        }
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