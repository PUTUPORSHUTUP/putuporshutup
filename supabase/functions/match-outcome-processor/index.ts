import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
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

    console.log("🎯 Starting match outcome processing automation");

    // Get recent unprocessed challenge stats
    const { data: challengeStats, error: statsError } = await supabaseService
      .from("challenge_stats")
      .select(`
        *,
        challenges!inner(
          id,
          title,
          status,
          game:games(display_name),
          challenge_participants(user_id, stake_paid)
        )
      `)
      .eq("verified", false)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (statsError) {
      console.error("Error fetching challenge stats:", statsError);
      throw statsError;
    }

    let processedCount = 0;
    let autoVerifiedCount = 0;
    const results = [];

    for (const stat of challengeStats || []) {
      try {
        console.log(`Processing stat for challenge ${stat.challenge_id}, user ${stat.user_id}`);

        const outcome = await processMatchOutcome(supabaseService, stat);
        results.push(outcome);
        
        processedCount++;
        if (outcome.autoVerified) {
          autoVerifiedCount++;
        }

        // Log the processing result
        await supabaseService
          .from("automated_actions")
          .insert({
            automation_type: "match_outcome_processing",
            action_type: "outcome_detection",
            target_id: stat.id,
            success: true,
            action_data: {
              challenge_id: stat.challenge_id,
              user_id: stat.user_id,
              result: outcome.result,
              confidence: outcome.confidence,
              auto_verified: outcome.autoVerified
            }
          });

      } catch (error) {
        console.error(`Error processing stat ${stat.id}:`, error);
        results.push({
          stat_id: stat.id,
          error: error.message,
          result: 'error'
        });
      }
    }

    // Check for stale matches that need fallback processing
    await processStaleMatches(supabaseService);
    
    // Check for failed launch timeouts
    await processLaunchTimeouts(supabaseService);

    console.log(`✅ Match outcome processing completed. Processed: ${processedCount}, Auto-verified: ${autoVerifiedCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      autoVerified: autoVerifiedCount,
      results: results.slice(0, 10) // Return first 10 for preview
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in match outcome processor:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to process match outcomes",
      details: "Check console logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processMatchOutcome(supabase: any, stat: any) {
  const gameName = stat.challenges?.game?.display_name || 'Unknown';
  let result = 'pending';
  let confidence = 0;
  let autoVerified = false;

  // Auto-detection logic based on game type and stats
  if (gameName.includes('Call of Duty') || gameName.includes('COD')) {
    const outcome = await processCODOutcome(stat);
    result = outcome.result;
    confidence = outcome.confidence;
    autoVerified = outcome.confidence >= 80;
  } else if (gameName.includes('Apex Legends')) {
    const outcome = await processApexOutcome(stat);
    result = outcome.result;
    confidence = outcome.confidence;
    autoVerified = outcome.confidence >= 80;
  } else if (gameName.includes('Rocket League')) {
    const outcome = await processRocketLeagueOutcome(stat);
    result = outcome.result;
    confidence = outcome.confidence;
    autoVerified = outcome.confidence >= 80;
  } else {
    // Generic processing for other games
    const outcome = await processGenericOutcome(stat);
    result = outcome.result;
    confidence = outcome.confidence;
    autoVerified = outcome.confidence >= 70;
  }

  // Update the challenge stat if auto-verified
  if (autoVerified) {
    await supabase
      .from("challenge_stats")
      .update({
        verified: true,
        verified_by: null, // System verification
        updated_at: new Date().toISOString()
      })
      .eq("id", stat.id);

    // Update win/loss counts for user profile
    await updateUserWinLoss(supabase, stat.user_id, result);

    // Check if this completes the challenge
    await checkChallengeCompletion(supabase, stat.challenge_id);
  }

  return {
    stat_id: stat.id,
    result,
    confidence,
    autoVerified,
    processing_method: `auto_${gameName.toLowerCase().replace(/\s+/g, '_')}`
  };
}

async function processCODOutcome(stat: any) {
  let confidence = 0;
  let result = 'pending';

  // COD-specific logic
  if (stat.kills && stat.deaths !== undefined) {
    const kd = stat.kills / Math.max(stat.deaths, 1);
    confidence += 30;
    
    if (kd >= 1.5) {
      result = 'win';
      confidence += 30;
    } else if (kd < 0.8) {
      result = 'loss';
      confidence += 20;
    }
  }

  if (stat.placement) {
    confidence += 20;
    if (stat.placement === 1) {
      result = 'win';
      confidence += 30;
    } else if (stat.placement <= 3) {
      if (result === 'pending') result = 'win';
      confidence += 20;
    }
  }

  if (stat.proof_url) confidence += 20;

  return { result, confidence: Math.min(confidence, 100) };
}

async function processApexOutcome(stat: any) {
  let confidence = 0;
  let result = 'pending';

  if (stat.placement) {
    confidence += 40;
    if (stat.placement === 1) {
      result = 'win';
      confidence += 40;
    } else if (stat.placement <= 5) {
      result = 'win';
      confidence += 20;
    } else {
      result = 'loss';
      confidence += 10;
    }
  }

  if (stat.kills) {
    confidence += 20;
    if (stat.kills >= 5) {
      confidence += 10;
    }
  }

  if (stat.damage_dealt && stat.damage_dealt > 1000) {
    confidence += 10;
  }

  if (stat.proof_url) confidence += 20;

  return { result, confidence: Math.min(confidence, 100) };
}

async function processRocketLeagueOutcome(stat: any) {
  let confidence = 0;
  let result = 'pending';

  // For Rocket League, we'd need score data or explicit win/loss
  if (stat.score) {
    confidence += 30;
    if (stat.score > 500) {
      result = 'win';
      confidence += 30;
    } else {
      result = 'loss';
      confidence += 20;
    }
  }

  if (stat.custom_stats?.goals) {
    confidence += 20;
    if (stat.custom_stats.goals >= 2) {
      confidence += 10;
    }
  }

  if (stat.proof_url) confidence += 30;

  return { result, confidence: Math.min(confidence, 100) };
}

async function processGenericOutcome(stat: any) {
  let confidence = 0;
  let result = 'pending';

  if (stat.score) {
    confidence += 40;
    // Assume higher scores are better
    if (stat.score > 1000) {
      result = 'win';
      confidence += 20;
    }
  }

  if (stat.placement) {
    confidence += 30;
    if (stat.placement === 1) {
      result = 'win';
      confidence += 30;
    } else if (stat.placement <= 3) {
      result = 'win';
      confidence += 15;
    }
  }

  if (stat.proof_url) confidence += 30;

  return { result, confidence: Math.min(confidence, 100) };
}

async function updateUserWinLoss(supabase: any, userId: string, result: string) {
  if (result === 'win') {
    await supabase
      .from("profiles")
      .update({
        total_wins: supabase.raw('total_wins + 1')
      })
      .eq("user_id", userId);
  } else if (result === 'loss') {
    await supabase
      .from("profiles")
      .update({
        total_losses: supabase.raw('total_losses + 1')
      })
      .eq("user_id", userId);
  }
}

async function checkChallengeCompletion(supabase: any, challengeId: string) {
  // Check if all participants have submitted stats
  const { data: challenge } = await supabase
    .from("challenges")
    .select(`
      max_participants,
      challenge_participants(count),
      challenge_stats(count)
    `)
    .eq("id", challengeId)
    .single();

  if (challenge) {
    const participantCount = challenge.challenge_participants[0]?.count || 0;
    const statsCount = challenge.challenge_stats[0]?.count || 0;

    if (participantCount > 0 && statsCount >= participantCount) {
      // All participants have submitted - determine winner
      await determineWinnerAndDistributePrize(supabase, challengeId);
    }
  }
}

async function determineWinnerAndDistributePrize(supabase: any, challengeId: string) {
  // Get all verified stats for this challenge
  const { data: stats } = await supabase
    .from("challenge_stats")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("verified", true)
    .order("score", { ascending: false });

  if (stats && stats.length > 0) {
    const winner = stats[0];
    
    // Update challenge with winner
    await supabase
      .from("challenges")
      .update({
        status: 'completed',
        winner_id: winner.user_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", challengeId);

    console.log(`Challenge ${challengeId} completed. Winner: ${winner.user_id}`);
  }
}

async function processStaleMatches(supabase: any) {
  // Find challenges that are stuck in progress for too long
  const staleTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  
  const { data: staleChallenges } = await supabase
    .from("challenges")
    .select("id, title")
    .eq("status", "in_progress")
    .lt("updated_at", staleTime.toISOString());

  for (const challenge of staleChallenges || []) {
    console.log(`Processing stale challenge: ${challenge.id}`);
    
    // Implement fallback logic - could auto-cancel or mark for manual review
    await supabase
      .from("challenges")
      .update({
        status: 'cancelled',
        admin_notes: 'Auto-cancelled due to inactivity',
        updated_at: new Date().toISOString()
      })
      .eq("id", challenge.id);
  }
}

async function processLaunchTimeouts(supabase: any) {
  // Find matches that are in 'launching' state for more than 10 minutes with no players joined
  const timeoutTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  
  const { data: failedLaunches } = await supabase
    .from("challenges")
    .select(`
      id, 
      title, 
      created_at,
      challenge_participants(count)
    `)
    .eq("status", "launching")
    .lt("created_at", timeoutTime.toISOString());

  for (const match of failedLaunches || []) {
    const playersJoined = match.challenge_participants?.[0]?.count || 0;
    
    if (playersJoined === 0) {
      console.log(`Processing failed launch timeout for match: ${match.id}`);
      
      // Update match status to failed_to_launch
      await supabase
        .from("challenges")
        .update({
          status: 'failed_to_launch',
          admin_notes: 'Console failure – match never launched',
          updated_at: new Date().toISOString()
        })
        .eq("id", match.id);

      // Refund all players (if any had paid)
      await refundAllPlayers(supabase, match.id, 'Console failure – match never launched');
      
      // Log the automated action
      await supabase
        .from("automated_actions")
        .insert({
          automation_type: "launch_timeout_processing",
          action_type: "failed_to_launch",
          target_id: match.id,
          success: true,
          action_data: {
            reason: 'Console failure – match never launched',
            timeout_minutes: 10,
            players_joined: playersJoined
          }
        });
    }
  }
}

async function refundAllPlayers(supabase: any, matchId: string, reason: string) {
  // Get all participants who paid for this match
  const { data: participants } = await supabase
    .from("challenge_participants")
    .select("user_id, stake_paid")
    .eq("challenge_id", matchId);

  for (const participant of participants || []) {
    if (participant.stake_paid > 0) {
      console.log(`Refunding ${participant.stake_paid} to user ${participant.user_id} for failed launch`);
      
      // Refund the stake amount to user's wallet
      await supabase
        .from("profiles")
        .update({
          wallet_balance: supabase.raw(`wallet_balance + ${participant.stake_paid}`)
        })
        .eq("user_id", participant.user_id);

      // Create a transaction record for the refund
      await supabase
        .from("transactions")
        .insert({
          user_id: participant.user_id,
          type: 'refund',
          amount: participant.stake_paid,
          status: 'completed',
          description: `Refund for failed match launch: ${reason}`,
          metadata: {
            match_id: matchId,
            refund_reason: reason,
            automated: true
          }
        });
    }
  }
}