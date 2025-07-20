import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Get request body
    const { wager_id } = await req.json();
    
    if (!wager_id) {
      throw new Error("Wager ID required");
    }

    console.log("Processing wager cancellation for user:", user.id, "wager:", wager_id);

    // Use service role to perform database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user is either a participant or the creator of the wager
    const { data: participation } = await supabaseService
      .from("wager_participants")
      .select("*, wager:wagers(*)")
      .eq("wager_id", wager_id)
      .eq("user_id", user.id)
      .single();

    // If not a participant, check if user is the creator
    let isCreator = false;
    let wagerData = null;
    let refundAmount = 0;

    if (!participation) {
      const { data: wager } = await supabaseService
        .from("wagers")
        .select("*")
        .eq("id", wager_id)
        .eq("creator_id", user.id)
        .single();

      if (!wager) {
        throw new Error("You are not a participant in this wager");
      }

      isCreator = true;
      wagerData = wager;
      refundAmount = wager.stake_amount;
    } else {
      wagerData = participation.wager;
      refundAmount = participation.stake_paid;
    }

    // Check if wager is still open
    if (wagerData.status !== 'open') {
      throw new Error("Cannot leave wager - match has already started");
    }

    // Handle different cases for participants vs creators
    if (isCreator) {
      // If creator is canceling, cancel the entire wager
      await supabaseService
        .from("wagers")
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq("id", wager_id);
    } else {
      // If participant is leaving, remove them and update pot
      await supabaseService
        .from("wager_participants")
        .delete()
        .eq("wager_id", wager_id)
        .eq("user_id", user.id);

      // Update wager total pot
      await supabaseService
        .from("wagers")
        .update({
          total_pot: wagerData.total_pot - refundAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", wager_id);
    }

    // Get user's current balance
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Refund to user's wallet
    await supabaseService
      .from("profiles")
      .update({
        wallet_balance: profile.wallet_balance + refundAmount,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    // Create transaction record
    await supabaseService
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit", // Refund shows as deposit
        amount: refundAmount,
        status: "completed",
        description: `Refund from ${isCreator ? 'cancelled' : 'left'} wager: ${wagerData.title}`,
        created_at: new Date().toISOString()
      });

    console.log("Wager cancellation completed, refunded:", refundAmount);

    return new Response(JSON.stringify({ 
      success: true,
      message: `You have left the wager. $${refundAmount} has been refunded to your wallet.`,
      refund_amount: refundAmount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Wager cancellation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to leave wager" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});