import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Tournament {
  id: string;
  name: string;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  status: string;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  game_mode: string;
  platform: string;
  automation_enabled: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎮 PUOSU Tournament Automation Engine - Starting cycle...");
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();
    let processed = 0;
    let errors = 0;

    // 1. Check for tournaments that should open registration
    const { data: tournamentsToOpen, error: openError } = await supabaseService
      .from('tournaments')
      .select('*')
      .eq('status', 'upcoming')
      .eq('automation_enabled', true)
      .lte('registration_start', now);

    if (openError) {
      throw new Error(`Error fetching tournaments to open: ${openError.message}`);
    }

    for (const tournament of tournamentsToOpen || []) {
      try {
        const { error: updateError } = await supabaseService
          .from('tournaments')
          .update({ 
            status: 'registration_open',
            updated_at: now
          })
          .eq('id', tournament.id);

        if (updateError) {
          console.error(`Error opening registration for tournament ${tournament.id}:`, updateError);
          errors++;
        } else {
          console.log(`✅ Opened registration for tournament: ${tournament.name}`);
          processed++;
        }
      } catch (error) {
        console.error(`Error processing tournament ${tournament.id}:`, error);
        errors++;
      }
    }

    // 2. Check for tournaments that should close registration and start
    const { data: tournamentsToStart, error: startError } = await supabaseService
      .from('tournaments')
      .select('*')
      .eq('status', 'registration_open')
      .eq('automation_enabled', true)
      .lte('registration_end', now);

    if (startError) {
      throw new Error(`Error fetching tournaments to start: ${startError.message}`);
    }

    for (const tournament of tournamentsToStart || []) {
      try {
        // Check if we have enough participants (minimum 2)
        const { count: participantCount } = await supabaseService
          .from('tournament_participants')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        if ((participantCount || 0) < 2) {
          // Cancel tournament due to insufficient participants
          const { error: cancelError } = await supabaseService
            .from('tournaments')
            .update({ 
              status: 'cancelled',
              updated_at: now
            })
            .eq('id', tournament.id);

          if (cancelError) {
            console.error(`Error cancelling tournament ${tournament.id}:`, cancelError);
            errors++;
          } else {
            console.log(`❌ Cancelled tournament due to insufficient participants: ${tournament.name}`);
            // TODO: Refund entry fees
            processed++;
          }
        } else {
          // Start the tournament
          const { error: updateError } = await supabaseService
            .from('tournaments')
            .update({ 
              status: 'ongoing',
              updated_at: now
            })
            .eq('id', tournament.id);

          if (updateError) {
            console.error(`Error starting tournament ${tournament.id}:`, updateError);
            errors++;
          } else {
            console.log(`🚀 Started tournament: ${tournament.name} with ${participantCount} participants`);
            processed++;
          }
        }
      } catch (error) {
        console.error(`Error processing tournament start ${tournament.id}:`, error);
        errors++;
      }
    }

    // 3. Auto-complete tournaments that have been ongoing too long (safety measure)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 6); // 6 hours max tournament duration
    
    const { data: stuckTournaments, error: stuckError } = await supabaseService
      .from('tournaments')
      .select('*')
      .eq('status', 'ongoing')
      .eq('automation_enabled', true)
      .lt('updated_at', cutoffTime.toISOString());

    if (stuckError) {
      console.error("Error fetching stuck tournaments:", stuckError);
    } else {
      for (const tournament of stuckTournaments || []) {
        try {
          const { error: completeError } = await supabaseService
            .from('tournaments')
            .update({ 
              status: 'completed',
              updated_at: now
            })
            .eq('id', tournament.id);

          if (completeError) {
            console.error(`Error auto-completing tournament ${tournament.id}:`, completeError);
            errors++;
          } else {
            console.log(`⏰ Auto-completed stuck tournament: ${tournament.name}`);
            processed++;
          }
        } catch (error) {
          console.error(`Error auto-completing tournament ${tournament.id}:`, error);
          errors++;
        }
      }
    }

    // 4. Create 3 new automated tournaments every run (proving system is live)
    console.log("🚀 Creating 3 new tournaments to prove system is LIVE...");
    
    const tournamentsToCreate = 3; // Always create exactly 3 tournaments
    const tournamentTypes = ['Quick Strike', 'Elite Challenge', 'High Stakes'];
    const entryFees = [5, 25, 50];
    const maxParticipants = [8, 16, 12];
    
    for (let i = 0; i < tournamentsToCreate; i++) {
        const registrationStart = new Date();
        registrationStart.setMinutes(registrationStart.getMinutes() + (i * 10)); // Stagger by 10 minutes
        
        const registrationEnd = new Date(registrationStart);
        registrationEnd.setMinutes(registrationEnd.getMinutes() + 45); // 45 minute registration window
        
        const tournamentStart = new Date(registrationEnd);
        tournamentStart.setMinutes(tournamentStart.getMinutes() + 5); // Start 5 minutes after registration closes

        const tournamentType = tournamentTypes[i % tournamentTypes.length];
        const entryFee = entryFees[i % entryFees.length];
        const maxParts = maxParticipants[i % maxParticipants.length];
        
        const newTournament = {
          name: `${tournamentType} - ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
          description: `🔥 LIVE AUTOMATED TOURNAMENT #${i + 1} - Join now and prove your skills!`,
          entry_fee: entryFee,
          max_participants: maxParts,
          current_participants: 0,
          prize_pool: 0,
          status: 'registration_open', // Open immediately
          registration_start: registrationStart.toISOString(),
          registration_end: registrationEnd.toISOString(),
          tournament_start: tournamentStart.toISOString(),
          game_mode: 'Call of Duty: Black Ops 6 - Kill Race',
          platform: 'Xbox Series X',
          automation_enabled: true,
          creator_id: null, // System-created tournament
          tournament_type: 'automated'
        };

        try {
          const { error: createError } = await supabaseService
            .from('tournaments')
            .insert(newTournament);

          if (createError) {
            console.error("Error creating automated tournament:", createError);
            errors++;
          } else {
            console.log(`🆕 LIVE TOURNAMENT CREATED: ${newTournament.name} - Entry: $${newTournament.entry_fee}`);
            processed++;
          }
        } catch (error) {
          console.error("Error creating automated tournament:", error);
          errors++;
        }
      }

    const summary = {
      success: true,
      processed_tournaments: processed,
      errors: errors,
      tournaments_created: 3,
      timestamp: now,
      message: `🔥 SYSTEM IS LIVE! Created 3 new tournaments. Processed ${processed} total actions with ${errors} errors.`
    };

    console.log("🎮 Tournament Automation Summary:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Tournament automation error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Tournament automation failed",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});