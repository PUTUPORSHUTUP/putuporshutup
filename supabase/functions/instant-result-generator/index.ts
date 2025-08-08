import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challengeId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎲 INSTANT RESULT GENERATOR - Generating results for:', challengeId);

    // Get challenge participants
    const { data: participants, error: participantsError } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('challenge_id', challengeId);

    if (participantsError || !participants?.length) {
      throw new Error(`No participants found: ${participantsError?.message}`);
    }

    // Generate realistic game stats for each participant
    const generatedStats = [];
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      
      // Generate stats with some variability but realistic ranges
      const baseScore = 1000 + Math.floor(Math.random() * 2000); // 1000-3000 base score
      const kills = 8 + Math.floor(Math.random() * 15); // 8-23 kills
      const deaths = 3 + Math.floor(Math.random() * 8); // 3-11 deaths
      const assists = Math.floor(Math.random() * 10); // 0-10 assists
      const damage = kills * (80 + Math.random() * 40); // Realistic damage per kill
      
      // Add some performance variance for ranking
      const performanceModifier = Math.random() * 0.3 + 0.85; // 0.85 to 1.15 multiplier
      const finalScore = Math.floor(baseScore * performanceModifier);
      
      const stats = {
        challenge_id: challengeId,
        user_id: participant.user_id,
        kills: Math.floor(kills * performanceModifier),
        deaths,
        assists,
        score: finalScore,
        damage_dealt: Math.floor(damage * performanceModifier),
        placement: i + 1, // Will be updated after sorting
        verified: true,
        custom_stats: {
          kd_ratio: Math.round((kills / Math.max(deaths, 1)) * 100) / 100,
          accuracy: Math.round((60 + Math.random() * 30) * 100) / 100, // 60-90% accuracy
          headshot_percentage: Math.round((10 + Math.random() * 20) * 100) / 100 // 10-30% headshots
        }
      };
      
      generatedStats.push(stats);
    }

    // Sort by score to determine final placements
    generatedStats.sort((a, b) => b.score - a.score);
    
    // Update placements based on sorted scores
    generatedStats.forEach((stat, index) => {
      stat.placement = index + 1;
    });

    // Insert all stats
    const { data: insertedStats, error: statsError } = await supabase
      .from('challenge_stats')
      .insert(generatedStats)
      .select();

    if (statsError) {
      throw new Error(`Failed to insert stats: ${statsError.message}`);
    }

    console.log(`✅ Generated stats for ${generatedStats.length} participants`);

    // Update challenge status to indicate results are ready
    await supabase
      .from('challenges')
      .update({ 
        status: 'completed',
        end_time: new Date().toISOString(),
        winner_id: generatedStats[0].user_id
      })
      .eq('id', challengeId);

    const winner = generatedStats[0];
    console.log(`🏆 Winner: User ${winner.user_id} with ${winner.score} score, ${winner.kills} kills`);

    return new Response(JSON.stringify({
      success: true,
      challengeId,
      participantCount: participants.length,
      winner: {
        user_id: winner.user_id,
        score: winner.score,
        kills: winner.kills,
        placement: winner.placement
      },
      allStats: generatedStats.map(s => ({
        user_id: s.user_id,
        placement: s.placement,
        score: s.score,
        kills: s.kills,
        deaths: s.deaths
      })),
      message: 'Results generated instantly!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Instant result generation failed:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});