import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrizeDistributionRequest {
  tournamentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { tournamentId }: PrizeDistributionRequest = await req.json()

    console.log(`🏆 Starting prize distribution for tournament: ${tournamentId}`)

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('tournaments')
      .select('*, tournament_registrations(*)')
      .eq('id', tournamentId)
      .eq('status', 'completed')
      .single()

    if (tournamentError || !tournament) {
      throw new Error('Tournament not found or not completed')
    }

    if (!tournament.winner_id) {
      throw new Error('Tournament has no winner declared')
    }

    // Calculate prize distribution (you can customize this)
    const totalPrizePool = tournament.prize_pool || 0
    const prizeDistribution = calculatePrizeDistribution(totalPrizePool, tournament.tournament_registrations.length)

    // Get final standings from tournament matches
    const { data: finalStandings } = await supabaseClient
      .from('tournament_matches')
      .select('winner_id, loser_id')
      .eq('tournament_id', tournamentId)
      .eq('round_number', Math.log2(tournament.max_participants)) // Final round

    const results = {
      prizesDistributed: 0,
      totalAmount: 0,
      errors: []
    }

    // Distribute prizes based on final standings
    for (let i = 0; i < prizeDistribution.length; i++) {
      const prize = prizeDistribution[i]
      const winnerId = i === 0 ? tournament.winner_id : getPlayerByPosition(finalStandings, i + 1)

      if (!winnerId || prize.amount <= 0) continue

      try {
        // Get winner's profile for membership tier
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('is_premium, wallet_balance')
          .eq('user_id', winnerId)
          .single()

        if (!profile) continue

        // Calculate platform fee (premium users get reduced fees)
        const platformFeeRate = profile.is_premium ? 0.05 : 0.10 // 5% for premium, 10% for regular
        const platformFee = prize.amount * platformFeeRate
        const netPrize = prize.amount - platformFee

        // Try instant payout first
        let payoutSuccessful = false
        try {
          const { error: payoutError } = await supabaseClient.functions.invoke('instant-withdrawal', {
            body: {
              userId: winnerId,
              amount: netPrize,
              reason: `Tournament prize - ${prize.position} place`,
              tournamentId: tournamentId
            }
          })

          if (!payoutError) {
            payoutSuccessful = true
            console.log(`💳 Instant payout successful for ${winnerId}: $${netPrize}`)
          }
        } catch (payoutError) {
          console.log(`⚠️ Instant payout failed for ${winnerId}, crediting wallet instead`)
        }

        // If instant payout fails, credit wallet
        if (!payoutSuccessful) {
          const { error: walletError } = await supabaseClient
            .from('profiles')
            .update({
              wallet_balance: profile.wallet_balance + netPrize
            })
            .eq('user_id', winnerId)

          if (walletError) {
            results.errors.push(`Failed to credit wallet for ${winnerId}: ${walletError.message}`)
            continue
          }
        }

        // Record the transaction
        await supabaseClient
          .from('transactions')
          .insert({
            user_id: winnerId,
            type: 'tournament_prize',
            amount: netPrize,
            status: 'completed',
            description: `Tournament prize - ${prize.position} place`,
            metadata: {
              tournament_id: tournamentId,
              position: i + 1,
              gross_prize: prize.amount,
              platform_fee: platformFee,
              payout_method: payoutSuccessful ? 'instant' : 'wallet'
            }
          })

        // Record platform fee
        await supabaseClient
          .from('transactions')
          .insert({
            user_id: null, // Platform transaction
            type: 'platform_fee',
            amount: platformFee,
            status: 'completed',
            description: `Platform fee from tournament prize`,
            metadata: {
              tournament_id: tournamentId,
              winner_id: winnerId,
              original_prize: prize.amount
            }
          })

        // Create activity notification
        await supabaseClient
          .from('activities')
          .insert({
            user_id: winnerId,
            activity_type: 'prize_won',
            title: '🏆 Prize Won!',
            description: `Congratulations! You won $${netPrize} for placing ${prize.position} in the tournament.`,
            metadata: {
              tournament_id: tournamentId,
              prize_amount: netPrize,
              position: i + 1
            }
          })

        results.prizesDistributed++
        results.totalAmount += netPrize

        console.log(`✅ Prize distributed: ${winnerId} - $${netPrize} (${prize.position} place)`)

      } catch (error: any) {
        console.error(`Error distributing prize to ${winnerId}:`, error)
        results.errors.push(`Prize distribution failed for ${winnerId}: ${error.message}`)
      }
    }

    // Mark tournament as prizes distributed
    await supabaseClient
      .from('tournaments')
      .update({ 
        status: 'completed',
        prizes_distributed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)

    console.log(`🎉 Prize distribution complete for tournament ${tournamentId}:`, results)

    return new Response(JSON.stringify({
      success: true,
      message: `Distributed ${results.prizesDistributed} prizes totaling $${results.totalAmount}`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Prize distribution error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

function calculatePrizeDistribution(totalPrizePool: number, participantCount: number) {
  // Customize prize distribution based on tournament size
  if (participantCount >= 8) {
    // Large tournament: 50% winner, 30% second, 20% third
    return [
      { position: '1st', amount: totalPrizePool * 0.50 },
      { position: '2nd', amount: totalPrizePool * 0.30 },
      { position: '3rd', amount: totalPrizePool * 0.20 }
    ]
  } else if (participantCount >= 4) {
    // Medium tournament: 70% winner, 30% second
    return [
      { position: '1st', amount: totalPrizePool * 0.70 },
      { position: '2nd', amount: totalPrizePool * 0.30 }
    ]
  } else {
    // Small tournament: winner takes all
    return [
      { position: '1st', amount: totalPrizePool }
    ]
  }
}

function getPlayerByPosition(matches: any[], position: number): string | null {
  // This is a simplified version - you'd need more complex logic
  // to determine exact final standings from bracket results
  if (position === 1) {
    return matches.find(m => m.winner_id)?.winner_id || null
  }
  if (position === 2) {
    return matches.find(m => m.loser_id)?.loser_id || null
  }
  return null
}