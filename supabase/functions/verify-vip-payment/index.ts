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
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === "paid") {
      // Create Supabase client with service role
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const userId = session.metadata?.user_id;
      
      if (userId) {
        // Update user to VIP status
        const { error: updateError } = await supabaseService
          .from("profiles")
          .update({
            is_premium: true,
            vip_access: true,
            premium_expires_at: null, // Lifetime VIP
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating VIP status:", updateError);
          throw updateError;
        }

        console.log("VIP status activated for user:", userId);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: "VIP status activated successfully!" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      message: "Payment not completed or user not found" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error("VIP verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});