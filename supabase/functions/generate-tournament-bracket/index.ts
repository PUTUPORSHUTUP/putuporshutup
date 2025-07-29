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
    
    if (!tournamentId) {
      throw new Error("Tournament ID is required");
    }

    // Use service role for admin operations
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

    // Get tournament participants
    const { data: participants, error: participantsError } = await supabaseService
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("bracket_position");

    if (participantsError) {
      throw new Error("Failed to fetch participants");
    }

    if (!participants) {
      throw new Error("Failed to fetch participants");
    }

    // Allow empty tournaments for admin testing
    if (participants.length === 0) {
      console.log('Creating empty tournament bracket for admin testing');
      
      // Update tournament status to in_progress even with no participants
      await supabaseService
        .from("tournaments")
        .update({ 
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", tournamentId);

      return new Response(JSON.stringify({ 
        success: true,
        message: "Empty tournament started for testing",
        matchesCreated: 0,
        rounds: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if bracket already exists
    const { data: existingMatches } = await supabaseService
      .from("tournament_matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .limit(1);

    if (existingMatches && existingMatches.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Bracket already exists" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate bracket matches
    const maxParticipants = tournament.max_participants;
    const totalRounds = Math.log2(maxParticipants);
    const matches = [];

    // Create first round matches
    let matchNumber = 1;
    const firstRoundMatches = participants.length / 2;
    
    for (let i = 0; i < firstRoundMatches; i++) {
      const player1Index = i * 2;
      const player2Index = player1Index + 1;
      
      matches.push({
        tournament_id: tournamentId,
        round_number: 1,
        match_number: matchNumber++,
        player1_id: participants[player1Index]?.user_id || null,
        player2_id: participants[player2Index]?.user_id || null,
        status: 'pending',
        scheduled_time: null
      });
    }

    // Generate subsequent rounds (empty matches for bracket structure)
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = maxParticipants / Math.pow(2, round);
      matchNumber = 1;
      
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: matchNumber++,
          player1_id: null,
          player2_id: null,
          status: 'pending',
          scheduled_time: null
        });
      }
    }

    // Insert all matches
    const { error: matchesError } = await supabaseService
      .from("tournament_matches")
      .insert(matches);

    if (matchesError) {
      throw new Error("Failed to create tournament matches");
    }

    // Update tournament status to in_progress
    await supabaseService
      .from("tournaments")
      .update({ 
        status: "in_progress",
        updated_at: new Date().toISOString()
      })
      .eq("id", tournamentId);

    console.log(`Generated ${matches.length} matches for tournament ${tournamentId}`);

    return new Response(JSON.stringify({ 
      success: true,
      matchesCreated: matches.length,
      rounds: totalRounds 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating tournament bracket:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate bracket" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});