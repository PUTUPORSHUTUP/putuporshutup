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
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("🤖 Starting automated wallet payout processing...");

    // Process completed challenges that need payouts
    const { data: completedChallenges } = await supabaseService
      .from("challenges")
      .select(`
        *,
        challenge_participants (
          user_id,
          stake_paid,
          profiles (username, wallet_balance)
        )
      `)
      .eq("status", "completed")
      .is("winner_id", null)
      .not("winner_id", "is", null);

    // Process completed tournaments that need payouts
    const { data: completedTournaments } = await supabaseService
      .from("tournaments")
      .select(`
        *,
        tournament_registrations (
          user_id,
          profiles (username, wallet_balance)
        )
      `)
      .eq("status", "completed")
      .eq("prizes_distributed", false);

    let processedPayouts = 0;
    let totalPayoutAmount = 0;
    let errors = [];

    // Process Challenge Payouts
    for (const challenge of completedChallenges || []) {
      try {
        if (!challenge.winner_id) continue;

        const totalPot = challenge.total_pot || (challenge.stake_amount * 2);
        const platformFeeRate = 0.10; // 10% platform fee
        const winnerPayout = totalPot * (1 - platformFeeRate);
        const platformFee = totalPot * platformFeeRate;

        console.log(`💰 Processing challenge ${challenge.id}: $${winnerPayout} to winner ${challenge.winner_id}`);

        // Update winner's wallet balance
        const { error: walletError } = await supabaseService
          .rpc("increment_wallet_balance", {
            user_id_param: challenge.winner_id,
            amount_param: winnerPayout
          });

        if (walletError) {
          throw new Error(`Wallet update failed: ${walletError.message}`);
        }

        // Record transaction
        await supabaseService
          .from("transactions")
          .insert({
            user_id: challenge.winner_id,
            type: "challenge_win",
            amount: winnerPayout,
            status: "completed",
            description: `Challenge victory: ${challenge.title}`,
            metadata: {
              challenge_id: challenge.id,
              platform_fee: platformFee,
              total_pot: totalPot,
              automated: true
            }
          });

        // Create activity notification
        await supabaseService
          .from("activities")
          .insert({
            user_id: challenge.winner_id,
            activity_type: "challenge_won",
            title: "🏆 Challenge Victory!",
            description: `You won "${challenge.title}" and earned $${winnerPayout.toFixed(2)}!`,
            metadata: {
              challenge_id: challenge.id,
              payout_amount: winnerPayout
            }
          });

        // Update challenge to mark payout as processed
        await supabaseService
          .from("challenges")
          .update({
            updated_at: new Date().toISOString(),
            admin_notes: `Automated payout processed: $${winnerPayout}`
          })
          .eq("id", challenge.id);

        processedPayouts++;
        totalPayoutAmount += winnerPayout;

      } catch (error) {
        console.error(`❌ Error processing challenge ${challenge.id}:`, error);
        errors.push(`Challenge ${challenge.id}: ${error.message}`);
      }
    }

    // Process Tournament Payouts
    for (const tournament of completedTournaments || []) {
      try {
        if (!tournament.winner_id) continue;

        const totalPrizePool = tournament.prize_pool || (tournament.entry_fee * tournament.current_participants);
        const platformFeeRate = 0.10; // 10% platform fee
        
        // Prize distribution
        const firstPlace = totalPrizePool * 0.7;
        const secondPlace = totalPrizePool * 0.2;
        const thirdPlace = totalPrizePool * 0.1;
        
        const prizeDistribution = [
          { amount: firstPlace * (1 - platformFeeRate), position: "1st" },
          { amount: secondPlace * (1 - platformFeeRate), position: "2nd" },
          { amount: thirdPlace * (1 - platformFeeRate), position: "3rd" }
        ];

        console.log(`🏆 Processing tournament ${tournament.id}: $${totalPrizePool} prize pool`);

        // For now, just pay the winner (you can enhance this to get actual tournament results)
        const winnerPayout = prizeDistribution[0].amount;

        // Update winner's wallet balance
        const { error: walletError } = await supabaseService
          .rpc("increment_wallet_balance", {
            user_id_param: tournament.winner_id,
            amount_param: winnerPayout
          });

        if (walletError) {
          throw new Error(`Wallet update failed: ${walletError.message}`);
        }

        // Record transaction
        await supabaseService
          .from("transactions")
          .insert({
            user_id: tournament.winner_id,
            type: "tournament_prize",
            amount: winnerPayout,
            status: "completed",
            description: `Tournament victory: ${tournament.title}`,
            metadata: {
              tournament_id: tournament.id,
              position: 1,
              total_prize_pool: totalPrizePool,
              automated: true
            }
          });

        // Create activity notification
        await supabaseService
          .from("activities")
          .insert({
            user_id: tournament.winner_id,
            activity_type: "tournament_won",
            title: "🏆 Tournament Champion!",
            description: `You won "${tournament.title}" and earned $${winnerPayout.toFixed(2)}!`,
            metadata: {
              tournament_id: tournament.id,
              payout_amount: winnerPayout
            }
          });

        // Mark tournament as prizes distributed
        await supabaseService
          .from("tournaments")
          .update({
            prizes_distributed: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", tournament.id);

        processedPayouts++;
        totalPayoutAmount += winnerPayout;

      } catch (error) {
        console.error(`❌ Error processing tournament ${tournament.id}:`, error);
        errors.push(`Tournament ${tournament.id}: ${error.message}`);
      }
    }

    // Log automation results
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "wallet_payouts",
        action_type: "batch_payout_processing",
        success: errors.length === 0,
        action_data: {
          challenges_processed: completedChallenges?.length || 0,
          tournaments_processed: completedTournaments?.length || 0,
          successful_payouts: processedPayouts,
          total_payout_amount: totalPayoutAmount,
          errors: errors
        }
      });

    console.log(`✅ Automated payout processing complete: ${processedPayouts} payouts, $${totalPayoutAmount.toFixed(2)} total`);

    return new Response(JSON.stringify({
      success: true,
      processed_payouts: processedPayouts,
      total_amount: totalPayoutAmount,
      challenges_processed: completedChallenges?.length || 0,
      tournaments_processed: completedTournaments?.length || 0,
      errors: errors
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("🚨 Automated wallet payout error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});