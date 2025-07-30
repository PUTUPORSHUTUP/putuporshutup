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
    const { tournamentId, reason, refundType } = await req.json();
    
    console.log('Emergency tournament stop requested:', { tournamentId, reason, refundType });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseService
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new Error("Tournament not found");
    }

    console.log(`Found tournament: ${tournament.title}, current status: ${tournament.status}`);

    // Initialize participants array - we'll handle different scenarios
    let participants = [];
    let totalRefunded = 0;
    const refundDetails = [];

    // Try to get participants but handle gracefully if table doesn't exist or has wrong columns
    try {
      // First try with stake_paid column
      const { data: participantsData, error } = await supabaseService
        .from("tournament_participants")
        .select("user_id, stake_paid")
        .eq("tournament_id", tournamentId);
      
      if (error) {
        console.log("Error querying tournament_participants with stake_paid:", error.message);
        
        // If stake_paid doesn't exist, try with entry_fee
        try {
          const { data: participantsDataAlt, error: errorAlt } = await supabaseService
            .from("tournament_participants")
            .select("user_id, entry_fee")
            .eq("tournament_id", tournamentId);
          
          if (errorAlt) {
            console.log("Error querying tournament_participants with entry_fee:", errorAlt.message);
            participants = [];
          } else {
            // Map entry_fee to stake_paid for consistency
            participants = (participantsDataAlt || []).map(p => ({
              user_id: p.user_id,
              stake_paid: p.entry_fee
            }));
          }
        } catch (altError) {
          console.log("Tournament_participants table structure unknown:", altError);
          participants = [];
        }
      } else {
        participants = participantsData || [];
      }
    } catch (tableError) {
      console.log("Tournament_participants table may not exist:", tableError.message);
      participants = [];
    }

    console.log(`Found ${participants.length} participants to process refunds for`);

    // Process refunds for each participant
    for (const participant of participants) {
      const refundAmount = refundType === "full" ? participant.stake_paid : participant.stake_paid * 0.5;
      
      // Add money back to user's wallet
      const { error: walletError } = await supabaseService
        .rpc("increment_wallet_balance", {
          user_id_param: participant.user_id,
          amount_param: refundAmount
        });

      if (walletError) {
        console.error(`Failed to refund user ${participant.user_id}:`, walletError);
        continue;
      }

      // Create refund transaction record
      await supabaseService
        .from("transactions")
        .insert({
          user_id: participant.user_id,
          type: "refund",
          amount: refundAmount,
          status: "completed",
          description: `Tournament refund: ${reason}`,
          metadata: {
            tournamentId,
            originalEntryFee: participant.stake_paid,
            refundType,
            reason
          }
        });

      totalRefunded += refundAmount;
      refundDetails.push({
        userId: participant.user_id,
        refundAmount,
        originalFee: participant.stake_paid
      });
    }

    // Update tournament status
    await supabaseService
      .from("tournaments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        cancellation_reason: reason,
        total_refunded: totalRefunded
      })
      .eq("id", tournamentId);

    // Cancel any active matches
    await supabaseService
      .from("tournament_matches")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("tournament_id", tournamentId)
      .in("status", ["pending", "in_progress"]);

    // Log the emergency action
    await supabaseService
      .from("automated_actions")
      .insert({
        automation_type: "emergency_tournament_stop",
        action_type: "refund_and_cancel",
        success: true,
        target_id: tournamentId,
        action_data: {
          reason,
          refundType,
          participantCount: participants.length,
          totalRefunded,
          refundDetails
        }
      });

    console.log(`Tournament ${tournamentId} cancelled. Refunded $${totalRefunded} to ${participants.length} players`);

    return new Response(JSON.stringify({
      success: true,
      message: "Tournament cancelled and refunds processed",
      details: {
        tournamentId,
        participantCount: participants.length,
        totalRefunded,
        refundType,
        reason
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error stopping tournament:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to stop tournament",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});