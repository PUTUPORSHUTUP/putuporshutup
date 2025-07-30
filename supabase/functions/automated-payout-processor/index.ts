import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { challengeId, winnerId, verificationMethod, amount } = await req.json();
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`Processing automated payout for challenge ${challengeId}, winner: ${winnerId}`);

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabaseService
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new Error(`Challenge not found: ${challengeError?.message}`);
    }

    // Calculate payout amount (total pot minus platform fee)
    const platformFeeRate = 0.10; // 10% platform fee
    const payoutAmount = (amount || challenge.total_pot) * (1 - platformFeeRate);
    const platformFee = (amount || challenge.total_pot) * platformFeeRate;

    // Get winner profile
    const { data: winnerProfile, error: profileError } = await supabaseService
      .from("profiles")
      .select("*")
      .eq("user_id", winnerId)
      .single();

    if (profileError || !winnerProfile) {
      throw new Error(`Winner profile not found: ${profileError?.message}`);
    }

    // Update winner's wallet balance
    const { error: walletError } = await supabaseService
      .rpc("increment_wallet_balance", {
        user_id_param: winnerId,
        amount_param: payoutAmount
      });

    if (walletError) {
      throw new Error(`Failed to update wallet: ${walletError.message}`);
    }

    // Record the transaction
    const { error: transactionError } = await supabaseService
      .from("transactions")
      .insert({
        user_id: winnerId,
        type: "challenge_win",
        amount: payoutAmount,
        status: "completed",
        description: `Automated payout for challenge: ${challenge.title}`,
        metadata: {
          challengeId: challengeId,
          verificationMethod: verificationMethod,
          platformFee: platformFee,
          originalAmount: amount || challenge.total_pot,
          automated: true
        }
      });

    if (transactionError) {
      throw new Error(`Failed to record transaction: ${transactionError.message}`);
    }

    // Update Xbox leaderboard stats if Xbox verified
    if (verificationMethod === "xbox_live_api" && winnerProfile.xbox_xuid) {
      await supabaseService
        .rpc("update_xbox_leaderboard_stats", {
          p_xuid: winnerProfile.xbox_xuid,
          p_kills: 0, // Stats already recorded during verification
          p_deaths: 0,
          p_assists: 0,
          p_score: 0,
          p_won_challenge: true,
          p_winnings: payoutAmount
        });
    }

    // Log automated action
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "automated_payout",
        action_type: "challenge_payout_processed",
        success: true,
        target_id: challengeId,
        action_data: {
          winnerId: winnerId,
          payoutAmount: payoutAmount,
          platformFee: platformFee,
          verificationMethod: verificationMethod,
          challengeTitle: challenge.title
        }
      });

    // Send notification to winner
    await supabaseService
      .from("match_notifications")
      .insert({
        user_id: winnerId,
        notification_type: "payout_processed",
        title: "🎉 Challenge Win Payout!",
        message: `Congratulations! You've won $${payoutAmount.toFixed(2)} from "${challenge.title}". Funds have been added to your wallet.`,
        match_id: challengeId,
        is_read: false
      });

    // Create activity record
    await supabaseService
      .from("activities")
      .insert({
        user_id: winnerId,
        activity_type: "challenge_won",
        title: "Challenge Victory!",
        description: `Won "${challenge.title}" - $${payoutAmount.toFixed(2)} added to wallet`,
        metadata: {
          challengeId: challengeId,
          payoutAmount: payoutAmount,
          verificationMethod: verificationMethod
        }
      });

    console.log(`Automated payout completed: $${payoutAmount} to user ${winnerId}`);

    return new Response(JSON.stringify({
      success: true,
      payoutAmount: payoutAmount,
      platformFee: platformFee,
      winnerId: winnerId,
      challengeId: challengeId,
      verificationMethod: verificationMethod,
      message: "Automated payout processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in automated payout processor:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to process automated payout",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});