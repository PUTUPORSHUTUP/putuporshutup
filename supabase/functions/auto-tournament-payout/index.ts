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
    const { tournamentId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log(`💰 Auto-Payout: Processing tournament ${tournamentId}`);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new Error("Tournament not found");
    }

    // Get all registrations
    const { data: registrations } = await supabaseClient
      .from("tournament_registrations")
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq("tournament_id", tournamentId);

    if (!registrations || registrations.length === 0) {
      console.log("❌ No registrations found for tournament");
      return new Response(JSON.stringify({ message: "No participants to pay out" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const totalPrizePool = tournament.entry_fee * registrations.length;
    const prizeDistribution = tournament.prize_distribution || { "1st": 0.7, "2nd": 0.2, "3rd": 0.1 };
    
    // Simulate winner selection (in real app, this would come from match results)
    const winners = registrations.slice(0, Math.min(3, registrations.length))
      .map((reg, index) => ({
        ...reg,
        position: index + 1,
        prize_amount: totalPrizePool * (
          index === 0 ? prizeDistribution["1st"] || 0.7 :
          index === 1 ? prizeDistribution["2nd"] || 0.2 :
          prizeDistribution["3rd"] || 0.1
        )
      }));

    console.log(`🏆 Paying out ${winners.length} winners from $${totalPrizePool} prize pool`);

    // Process payouts
    const payoutPromises = winners.map(async (winner) => {
      // Update user's wallet balance
      await supabaseClient
        .from("profiles")
        .update({
          wallet_balance: winner.profiles.wallet_balance + winner.prize_amount,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", winner.user_id);

      // Record transaction
      await supabaseClient
        .from("transactions")
        .insert({
          user_id: winner.user_id,
          type: "tournament_prize",
          amount: winner.prize_amount,
          status: "completed",
          description: `Prize for ${winner.position}${winner.position === 1 ? 'st' : winner.position === 2 ? 'nd' : 'rd'} place in ${tournament.title}`,
          metadata: {
            tournament_id: tournamentId,
            position: winner.position,
            total_participants: registrations.length
          }
        });

      console.log(`✅ Paid $${winner.prize_amount} to winner #${winner.position}`);
      return { user_id: winner.user_id, amount: winner.prize_amount, position: winner.position };
    });

    const payoutResults = await Promise.all(payoutPromises);

    // Update tournament status
    await supabaseClient
      .from("tournaments")
      .update({
        status: "completed",
        prizes_distributed: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", tournamentId);

    // Update engine revenue tracking
    const platformRevenue = totalPrizePool * 0.1; // 10% platform cut
    await supabaseClient
      .from("tournament_engine_status")
      .update({
        total_revenue_today: supabaseClient.raw(`total_revenue_today + ${platformRevenue}`),
        updated_at: new Date().toISOString()
      });

    // Log automated action
    await supabaseClient
      .from("automated_actions")
      .insert({
        automation_type: "tournament_payout",
        action_type: "distribute_prizes",
        success: true,
        action_data: {
          tournament_id: tournamentId,
          total_prize_pool: totalPrizePool,
          platform_revenue: platformRevenue,
          winners_paid: payoutResults.length,
          payouts: payoutResults
        }
      });

    return new Response(JSON.stringify({
      success: true,
      tournament_id: tournamentId,
      total_prize_pool: totalPrizePool,
      platform_revenue: platformRevenue,
      winners_paid: payoutResults.length,
      payouts: payoutResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Auto-Payout Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});