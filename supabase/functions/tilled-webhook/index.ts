import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Tilled webhook received");

    // Get event from webhook
    const event = await req.json();
    console.log("Webhook event type:", event.type);
    console.log("Event data:", event.data);

    // Initialize Supabase client with service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'charge.succeeded':
        // ✅ Entry fee paid
        console.log('✅ Charge succeeded:', event.data.id);
        
        // Update transaction status to completed
        const { error: chargeError } = await supabaseService
          .from('transactions')
          .update({ 
            status: 'completed',
            stripe_payment_intent: event.data.id 
          })
          .eq('stripe_payment_intent', event.data.id);

        if (chargeError) {
          console.error("Error updating charge transaction:", chargeError);
        }

        // If this is for a challenge/wager, update status
        if (event.data.metadata?.challenge_id) {
          console.log("Updating challenge status for:", event.data.metadata.challenge_id);
          // Add logic to update challenge/wager status if needed
        }

        break;

      case 'transfer.paid':
        // 💸 Payout sent to winner
        console.log('💸 Transfer paid:', event.data.id);
        
        // Log successful payout transaction
        if (event.data.metadata?.user_id) {
          const { error: payoutError } = await supabaseService
            .from('transactions')
            .insert({
              user_id: event.data.metadata.user_id,
              type: 'payout',
              amount: event.data.amount / 100, // Convert from cents to dollars
              status: 'completed',
              stripe_payment_intent: event.data.id,
              description: `Winner Payout - Challenge ${event.data.metadata?.challenge_id || 'Unknown'} - Tilled`,
              created_at: new Date().toISOString()
            });

          if (payoutError) {
            console.error("Error logging payout transaction:", payoutError);
          }
        }

        // Mark payout complete for challenge
        if (event.data.metadata?.challenge_id) {
          console.log("Marking payout complete for:", event.data.metadata.challenge_id);
          // Add logic to mark challenge payout as complete
        }

        break;

      case 'charge.refunded':
        // 🔁 Refund confirmed
        console.log('🔁 Refund processed:', event.data.id);
        
        // Update original transaction or create refund record
        const { error: refundError } = await supabaseService
          .from('transactions')
          .update({ 
            status: 'refunded',
            description: `${event.data.metadata?.reason || 'Refunded'} - Tilled Webhook Confirmed`
          })
          .eq('stripe_payment_intent', event.data.id);

        if (refundError) {
          console.error("Error updating refund transaction:", refundError);
        }

        // Log refund and update challenge status
        if (event.data.metadata?.challenge_id) {
          console.log("Logging refund for challenge:", event.data.metadata.challenge_id);
          // Add logic to update challenge/wager status to refunded
        }

        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed",
      details: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});