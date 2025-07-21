import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MATCH-PLAYERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting player matching process");

    // Clean up expired queue entries first
    await supabaseClient.rpc('cleanup_expired_queue_entries');
    logStep("Cleaned up expired queue entries");

    // Get all users currently searching for matches
    const { data: searchingUsers, error: searchError } = await supabaseClient
      .from('match_queue')
      .select(`
        *,
        profiles:user_id (
          display_name,
          username,
          wallet_balance
        ),
        games (
          display_name,
          name
        )
      `)
      .eq('queue_status', 'searching')
      .order('queued_at', { ascending: true });

    if (searchError) {
      logStep("Error fetching searching users", { error: searchError });
      throw searchError;
    }

    if (!searchingUsers || searchingUsers.length < 2) {
      logStep("Not enough users in queue for matching", { count: searchingUsers?.length || 0 });
      return new Response(JSON.stringify({ 
        message: "Not enough users in queue for matching",
        usersInQueue: searchingUsers?.length || 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found users in queue", { count: searchingUsers.length });

    let matchesMade = 0;

    // Try to match users
    for (let i = 0; i < searchingUsers.length - 1; i++) {
      const user1 = searchingUsers[i];
      
      // Skip if user1 is already matched
      if (user1.queue_status !== 'searching') continue;

      for (let j = i + 1; j < searchingUsers.length; j++) {
        const user2 = searchingUsers[j];
        
        // Skip if user2 is already matched
        if (user2.queue_status !== 'searching') continue;

        // Check if users are compatible for matching
        const isCompatible = checkCompatibility(user1, user2);
        
        if (isCompatible) {
          logStep("Found compatible match", { 
            user1: user1.user_id, 
            user2: user2.user_id,
            stake: user1.stake_amount,
            game: user1.games?.display_name 
          });

          try {
            // Create the wager for matched users
            const wagerResult = await createMatchedWager(supabaseClient, user1, user2);
            
            if (wagerResult.success) {
              // Update queue entries to matched status
              await supabaseClient
                .from('match_queue')
                .update({
                  queue_status: 'matched',
                  matched_with_user_id: user2.user_id,
                  matched_at: new Date().toISOString(),
                  wager_id: wagerResult.wagerId
                })
                .eq('id', user1.id);

              await supabaseClient
                .from('match_queue')
                .update({
                  queue_status: 'matched',
                  matched_with_user_id: user1.user_id,
                  matched_at: new Date().toISOString(),
                  wager_id: wagerResult.wagerId
                })
                .eq('id', user2.id);

              // Create notifications for both users
              await createMatchNotifications(supabaseClient, user1, user2, wagerResult.wagerId);

              matchesMade++;
              
              // Mark users as matched in our local array to prevent double matching
              user1.queue_status = 'matched';
              user2.queue_status = 'matched';

              logStep("Successfully created match and wager", { 
                wagerId: wagerResult.wagerId,
                matchesMade 
              });
              
              break; // Move to next user1
            }
          } catch (error) {
            logStep("Error creating match", { error: error.message });
            // Continue trying other matches if this one fails
          }
        }
      }
    }

    logStep("Matching process completed", { matchesMade });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Matching completed. ${matchesMade} matches made.`,
      matchesMade 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in match-players function", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function checkCompatibility(user1: any, user2: any): boolean {
  // Must be different users
  if (user1.user_id === user2.user_id) return false;

  // Must be same game and platform
  if (user1.game_id !== user2.game_id) return false;
  if (user1.platform !== user2.platform) return false;

  // Stakes must be exactly the same for automatic matching
  if (user1.stake_amount !== user2.stake_amount) return false;

  // Check if both users have sufficient wallet balance
  const user1Balance = user1.profiles?.wallet_balance || 0;
  const user2Balance = user2.profiles?.wallet_balance || 0;
  
  if (user1Balance < user1.stake_amount || user2Balance < user2.stake_amount) {
    return false;
  }

  return true;
}

async function createMatchedWager(supabaseClient: any, user1: any, user2: any) {
  try {
    // Create the wager
    const { data: wager, error: wagerError } = await supabaseClient
      .from('wagers')
      .insert({
        creator_id: user1.user_id,
        game_id: user1.game_id,
        platform: user1.platform,
        stake_amount: user1.stake_amount,
        max_participants: 2,
        title: `Auto Match: ${user1.games?.display_name || 'Game'} - $${user1.stake_amount}`,
        description: `Automatically matched wager between ${user1.profiles?.display_name || 'Player 1'} and ${user2.profiles?.display_name || 'Player 2'}`,
        status: 'full', // Set to full since we have both players
        total_pot: user1.stake_amount * 2
      })
      .select()
      .single();

    if (wagerError) {
      throw wagerError;
    }

    // Add both participants to the wager
    const { error: participant1Error } = await supabaseClient
      .from('wager_participants')
      .insert({
        wager_id: wager.id,
        user_id: user1.user_id,
        stake_paid: user1.stake_amount,
        status: 'joined'
      });

    if (participant1Error) {
      throw participant1Error;
    }

    const { error: participant2Error } = await supabaseClient
      .from('wager_participants')
      .insert({
        wager_id: wager.id,
        user_id: user2.user_id,
        stake_paid: user2.stake_amount,
        status: 'joined'
      });

    if (participant2Error) {
      throw participant2Error;
    }

    // Deduct stakes from both users' wallets
    const { error: balance1Error } = await supabaseClient
      .from('profiles')
      .update({
        wallet_balance: user1.profiles.wallet_balance - user1.stake_amount
      })
      .eq('user_id', user1.user_id);

    if (balance1Error) {
      throw balance1Error;
    }

    const { error: balance2Error } = await supabaseClient
      .from('profiles')
      .update({
        wallet_balance: user2.profiles.wallet_balance - user2.stake_amount
      })
      .eq('user_id', user2.user_id);

    if (balance2Error) {
      throw balance2Error;
    }

    return { success: true, wagerId: wager.id };
  } catch (error) {
    throw new Error(`Failed to create matched wager: ${error.message}`);
  }
}

async function createMatchNotifications(supabaseClient: any, user1: any, user2: any, wagerId: string) {
  const notifications = [
    {
      user_id: user1.user_id,
      match_queue_id: user1.id,
      matched_user_id: user2.user_id,
      wager_id: wagerId,
      notification_type: 'match_found',
      message: `Match found! You've been automatically matched with ${user2.profiles?.display_name || 'another player'} for a $${user1.stake_amount} wager.`
    },
    {
      user_id: user2.user_id,
      match_queue_id: user2.id,
      matched_user_id: user1.user_id,
      wager_id: wagerId,
      notification_type: 'match_found',
      message: `Match found! You've been automatically matched with ${user1.profiles?.display_name || 'another player'} for a $${user2.stake_amount} wager.`
    }
  ];

  const { error } = await supabaseClient
    .from('match_notifications')
    .insert(notifications);

  if (error) {
    console.error('Error creating match notifications:', error);
  }
}