import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportResultRequest {
  wager_id: string;
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

    const { wager_id, winner_id }: ReportResultRequest = await req.json();
    
    if (!wager_id || !winner_id) {
      throw new Error("Wager ID and Winner ID required");
    }

    console.log("Processing result report for wager:", wager_id, "winner:", winner_id, "by user:", user.id);

    // Get wager details with participants
    const { data: wager, error: wagerError } = await supabaseService
      .from("wagers")
      .select(`
        *,
        wager_participants(*)
      `)
      .eq("id", wager_id)
      .eq("status", "in_progress")
      .single();

    if (wagerError || !wager) {
      throw new Error("Wager not found or not in progress");
    }

    // Check if user is a participant or creator
    const isCreator = wager.creator_id === user.id;
    const isParticipant = wager.wager_participants.some((p: any) => p.user_id === user.id);

    if (!isCreator && !isParticipant) {
      throw new Error("Not authorized to report result for this wager");
    }

    // Verify winner is a valid participant
    const winnerIsValid = wager.wager_participants.some((p: any) => p.user_id === winner_id) || wager.creator_id === winner_id;
    if (!winnerIsValid) {
      throw new Error("Winner must be a participant in this wager");
    }

    // Check if this user has already reported a result
    const { data: existingReport } = await supabaseService
      .from("wager_result_reports")
      .select("*")
      .eq("wager_id", wager_id)
      .eq("reported_by", user.id)
      .single();

    if (existingReport) {
      throw new Error("You have already reported a result for this wager");
    }

    // Insert the result report
    await supabaseService
      .from("wager_result_reports")
      .insert({
        wager_id,
        winner_id,
        reported_by: user.id,
        created_at: new Date().toISOString()
      });

    // Get all reports for this wager
    const { data: allReports } = await supabaseService
      .from("wager_result_reports")
      .select("*")
      .eq("wager_id", wager_id);

    const totalParticipants = wager.wager_participants.length + (wager.creator_id ? 1 : 0);
    const reportsForWinner = allReports?.filter(r => r.winner_id === winner_id).length || 0;
    const uniqueReporters = new Set(allReports?.map(r => r.reported_by)).size;

    // Check if we have consensus (majority agreement)
    const majorityNeeded = Math.ceil(totalParticipants / 2);
    const hasConsensus = reportsForWinner >= majorityNeeded;

    let message = "Result reported successfully";

    if (hasConsensus) {
      // Finalize the wager
      await finalizeWager(supabaseService, wager_id, winner_id, wager.total_pot);
      message = "Wager completed! Winner has been paid out.";
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

async function finalizeWager(supabaseService: any, wagerId: string, winnerId: string, totalPot: number) {
  try {
    // Update wager status
    await supabaseService
      .from("wagers")
      .update({
        status: "completed",
        winner_id: winnerId,
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", wagerId);

    // Get winner's current balance
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance, total_wins")
      .eq("user_id", winnerId)
      .single();

    if (!profile) {
      throw new Error("Winner profile not found");
    }

    // Update winner's wallet and stats
    await supabaseService
      .from("profiles")
      .update({
        wallet_balance: profile.wallet_balance + totalPot,
        total_wins: profile.total_wins + 1,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", winnerId);

    // Create transaction record for winner
    await supabaseService
      .from("transactions")
      .insert({
        user_id: winnerId,
        type: "deposit",
        amount: totalPot,
        status: "completed",
        description: `Wager win payout - $${totalPot}`,
        created_at: new Date().toISOString()
      });

    // Update losers' stats
    const { data: participants } = await supabaseService
      .from("wager_participants")
      .select("user_id")
      .eq("wager_id", wagerId);

    const loserIds = participants?.map(p => p.user_id).filter(id => id !== winnerId) || [];
    
    // Include creator if they're not the winner
    const { data: wager } = await supabaseService
      .from("wagers")
      .select("creator_id")
      .eq("id", wagerId)
      .single();

    if (wager?.creator_id && wager.creator_id !== winnerId) {
      loserIds.push(wager.creator_id);
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

    console.log("Wager finalized successfully:", wagerId, "Winner:", winnerId, "Payout:", totalPot);

  } catch (error) {
    console.error("Error finalizing wager:", error);
    throw error;
  }
}