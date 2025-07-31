import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportResultRequest {
  challenge_id: string;
  winner_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseService.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { challenge_id, winner_id }: ReportResultRequest = await req.json();
    
    if (!challenge_id || !winner_id) {
      throw new Error("Challenge ID and Winner ID required");
    }

    console.log("Processing result report for challenge:", challenge_id, "winner:", winner_id, "by user:", user.id);

    // Get challenge details with participants
    const { data: challenge, error: challengeError } = await supabaseService
      .from("challenges")
      .select(`
        *,
        challenge_participants(*)
      `)
      .eq("id", challenge_id)
      .eq("status", "in_progress")
      .single();

    if (challengeError || !challenge) {
      throw new Error("Challenge not found or not in progress");
    }

    // Check if user is a participant or creator
    const isCreator = challenge.creator_id === user.id;
    const isParticipant = challenge.challenge_participants.some((p: any) => p.user_id === user.id);

    if (!isCreator && !isParticipant) {
      throw new Error("Not authorized to report result for this challenge");
    }

    // Verify winner is a valid participant
    const winnerIsValid = challenge.challenge_participants.some((p: any) => p.user_id === winner_id) || challenge.creator_id === winner_id;
    if (!winnerIsValid) {
      throw new Error("Winner must be a participant in this challenge");
    }

    // Check if this user has already reported a result
    const { data: existingReport } = await supabaseService
      .from("challenge_result_reports")
      .select("*")
      .eq("challenge_id", challenge_id)
      .eq("reported_by", user.id)
      .single();

    if (existingReport) {
      throw new Error("You have already reported a result for this challenge");
    }

    // Insert the result report
    await supabaseService
      .from("challenge_result_reports")
      .insert({
        challenge_id: challenge_id,
        winner_id,
        reported_by: user.id,
        created_at: new Date().toISOString()
      });

    // Get all reports for this challenge
    const { data: allReports } = await supabaseService
      .from("challenge_result_reports")
      .select("*")
      .eq("challenge_id", challenge_id);

    const totalParticipants = challenge.challenge_participants.length + (challenge.creator_id ? 1 : 0);
    const reportsForWinner = allReports?.filter(r => r.winner_id === winner_id).length || 0;
    const uniqueReporters = new Set(allReports?.map(r => r.reported_by)).size;

    // Check if we have consensus (majority agreement)
    const majorityNeeded = Math.ceil(totalParticipants / 2);
    const hasConsensus = reportsForWinner >= majorityNeeded;

    let message = "Result reported successfully";

    if (hasConsensus) {
      // Finalize the challenge
      await finalizeChallenge(supabaseService, challenge_id, winner_id, challenge.total_pot);
      message = "🏆 Challenge completed! Winner received INSTANT payout!";
    } else {
      message = `Result reported. Waiting for more reports (${reportsForWinner}/${majorityNeeded} needed).`;
    }

    console.log("Result report completed:", message);

    return new Response(JSON.stringify({ 
      success: true,
      message,
      reports_count: reportsForWinner,
      reports_needed: majorityNeeded,
      consensus_reached: hasConsensus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Wager result reporting error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to report result" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function finalizeChallenge(supabaseService: any, challengeId: string, winnerId: string, totalPot: number) {
  try {
    // Update challenge status
    await supabaseService
      .from("challenges")
      .update({
        status: "completed",
        winner_id: winnerId,
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", challengeId);

    // Get winner's profile with membership status
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance, total_wins, is_premium")
      .eq("user_id", winnerId)
      .single();

    if (!profile) {
      throw new Error("Winner profile not found");
    }

    // Calculate platform fee based on membership tier
    const membershipTier = profile.is_premium ? 'premium' : 'none';
    const platformFeePercentage = membershipTier === 'premium' ? 1.25 : 5; // 75% discount for premium, 5% base fee
    const platformFee = Math.round((totalPot * (platformFeePercentage / 100)) * 100) / 100;
    const netPayout = totalPot - platformFee;

    // INSTANT PAYOUT: Use Tilled to send winner instant payout
    try {
      console.log("Processing instant payout via Tilled for winner:", winnerId, "amount:", netPayout);
      
      // Call Tilled payout function
      const tilledResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/create-tilled-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          type: 'payout',
          amountInCents: Math.round(netPayout * 100),
          destinationAccountId: 'winner_account_id', // This would be the winner's connected account
          challengeId: challengeId,
          metadata: {
            user_id: winnerId,
            challenge_id: challengeId,
            original_amount: totalPot,
            platform_fee: platformFee
          }
        })
      });

      const tilledResult = await tilledResponse.json();
      
      if (tilledResult.success) {
        console.log("✅ Instant payout successful via Tilled:", tilledResult.payout.id);
        
        // Create transaction record for instant payout
        await supabaseService
          .from("transactions")
          .insert({
            user_id: winnerId,
            type: "payout",
            amount: netPayout,
            status: "completed",
            stripe_payment_intent: tilledResult.payout.id,
            description: `🏆 INSTANT Winner Payout - Challenge ${challengeId} (${platformFeePercentage}% platform fee deducted)`,
            created_at: new Date().toISOString()
          });
          
      } else {
        console.error("❌ Tilled payout failed, falling back to wallet credit");
        // Fallback: Credit winner's wallet balance
        await supabaseService
          .from("profiles")
          .update({
            wallet_balance: profile.wallet_balance + netPayout,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", winnerId);

        // Create transaction record for wallet credit
        await supabaseService
          .from("transactions")
          .insert({
            user_id: winnerId,
            type: "deposit",
            amount: netPayout,
            status: "completed",
            description: `🏆 Challenge Win Payout - ${challengeId} (${platformFeePercentage}% platform fee deducted)`,
            created_at: new Date().toISOString()
          });
      }
    } catch (tilledError) {
      console.error("Tilled payout error, crediting wallet instead:", tilledError);
      // Fallback: Credit winner's wallet balance
      await supabaseService
        .from("profiles")
        .update({
          wallet_balance: profile.wallet_balance + netPayout,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", winnerId);

      // Create transaction record for wallet credit
      await supabaseService
        .from("transactions")
        .insert({
          user_id: winnerId,
          type: "deposit",
          amount: netPayout,
          status: "completed",
          description: `🏆 Challenge Win Payout - ${challengeId} (${platformFeePercentage}% platform fee deducted)`,
          created_at: new Date().toISOString()
        });
    }

    // Update winner's stats
    await supabaseService
      .from("profiles")
      .update({
        total_wins: profile.total_wins + 1,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", winnerId);

    // Record platform fee transaction for revenue tracking
    await supabaseService
      .from("transactions")
      .insert({
        user_id: null, // Platform transaction (no specific user)
        type: "platform_fee",
        amount: platformFee,
        status: "completed",
        description: `Platform Fee (${platformFeePercentage}%) - Challenge ${challengeId}`,
        created_at: new Date().toISOString()
      });

    // Update losers' stats
    const { data: participants } = await supabaseService
      .from("challenge_participants")
      .select("user_id")
      .eq("challenge_id", challengeId);

    const loserIds = participants?.map(p => p.user_id).filter(id => id !== winnerId) || [];
    
    // Include creator if they're not the winner
    const { data: challenge } = await supabaseService
      .from("challenges")
      .select("creator_id")
      .eq("id", challengeId)
      .single();

    if (challenge?.creator_id && challenge.creator_id !== winnerId) {
      loserIds.push(challenge.creator_id);
    }

    // Update losers' loss count
    for (const loserId of loserIds) {
      const { data: loserProfile } = await supabaseService
        .from("profiles")
        .select("total_losses")
        .eq("user_id", loserId)
        .single();

      if (loserProfile) {
        await supabaseService
          .from("profiles")
          .update({
            total_losses: loserProfile.total_losses + 1,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", loserId);
      }
    }

    console.log("🏁 Challenge finalized with INSTANT payout:", challengeId, "Winner:", winnerId, "Net Payout:", netPayout, "Platform Fee:", platformFee);

  } catch (error) {
    console.error("Error finalizing challenge:", error);
    throw error;
  }
}