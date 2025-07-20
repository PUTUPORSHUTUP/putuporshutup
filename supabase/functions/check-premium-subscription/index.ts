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

    console.log("Checking subscription for user:", user.email);

    // Use service role to access subscriptions
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user's subscription from database
    const { data: subscription } = await supabaseService
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "inactive"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get subscription status from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    // Update subscription status in database
    const updatedStatus = stripeSubscription.status === "active" ? "active" : "inactive";
    
    await supabaseService
      .from("subscriptions")
      .update({
        status: updatedStatus,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    console.log("Subscription status updated:", updatedStatus);

    return new Response(JSON.stringify({
      subscribed: stripeSubscription.status === "active",
      status: stripeSubscription.status,
      current_period_end: stripeSubscription.current_period_end,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Check subscription error:", error);
    return new Response(JSON.stringify({ 
      subscribed: false,
      status: "inactive",
      error: error instanceof Error ? error.message : "Check failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 even on error for subscription checks
    });
  }
});