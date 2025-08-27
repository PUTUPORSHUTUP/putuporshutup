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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("🎯 Stripe webhook received:", event.type);

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const amount = parseFloat(session.metadata?.amount || '0');
        const type = session.metadata?.type;

        console.log("💰 Processing successful payment:", {
          sessionId: session.id,
          userId,
          amount,
          type
        });

        if (!userId || !amount || type !== 'wallet_deposit') {
          console.error("Missing required metadata in session");
          break;
        }

        try {
          // Try to use the wallet balance function if available
          const { data: walletResult, error: walletError } = await supabaseService
            .rpc('update_wallet_balance', {
              user_uuid: userId,
              amount_change: amount,
              txn_type: 'deposit',
              txn_description: `Stripe deposit - Session: ${session.id}`
            });

          if (walletError) {
            console.log("Wallet function not available, using manual update");
            
            // Fallback to manual balance update
            const { data: profile, error: getError } = await supabaseService
              .from("profiles")
              .select("wallet_balance")
              .eq("user_id", userId)
              .single();

            if (getError || !profile) {
              throw new Error("User profile not found");
            }

            const newBalance = (profile.wallet_balance || 0) + amount;

            const { error: updateError } = await supabaseService
              .from("profiles")
              .update({ 
                wallet_balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", userId);

            if (updateError) {
              throw new Error("Failed to update wallet balance");
            }

            // Create transaction record
            const { error: txnError } = await supabaseService.from("transactions").insert({
              user_id: userId,
              type: "deposit",
              amount: amount,
              status: "completed",
              description: `Stripe deposit - Session: ${session.id}`,
              payment_intent_id: session.id,
              created_at: new Date().toISOString()
            });

            if (txnError) {
              console.error("Error creating transaction record:", txnError);
              // Don't throw - the balance was updated successfully
            }

            console.log(`✅ Manual wallet update: $${amount} added to user ${userId}`);
          } else {
            console.log("✅ Wallet function executed successfully:", walletResult);
          }

          // Update any pending transaction records
          const { error: updateTxnError } = await supabaseService
            .from("transactions")
            .update({ 
              status: "completed",
              updated_at: new Date().toISOString()
            })
            .eq("payment_intent_id", session.id)
            .eq("status", "pending");

          if (updateTxnError) {
            console.error("Error updating transaction status:", updateTxnError);
          }

        } catch (dbError) {
          console.error("Database error processing deposit:", dbError);
          throw dbError;
        }

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("⏰ Payment session expired:", session.id);

        // Update any pending transaction records to failed
        const { error: updateError } = await supabaseService
          .from("transactions")
          .update({ 
            status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("payment_intent_id", session.id)
          .eq("status", "pending");

        if (updateError) {
          console.error("Error updating expired transaction:", updateError);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        console.log("❌ Payment failed:", paymentIntent.id);

        // Update transaction records to failed
        const { error: updateError } = await supabaseService
          .from("transactions")
          .update({ 
            status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("payment_intent_id", paymentIntent.id)
          .eq("status", "pending");

        if (updateError) {
          console.error("Error updating failed transaction:", updateError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Webhook processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});