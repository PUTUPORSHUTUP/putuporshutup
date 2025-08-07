import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play, Users, Trophy, AlertTriangle, Zap } from "lucide-react";

export function AdminSimPanel() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const callEdgeFunction = async (functionName: string, payload: any = {}) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${functionName} completed successfully`,
      });
      
      console.log(`${functionName} result:`, data);
      return data;
    } catch (error) {
      console.error(`${functionName} error:`, error);
      toast({
        title: "Error",
        description: `Failed to execute ${functionName}: ${String(error)}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const simulateMatchFlow = async () => {
    setBusy(true);
    try {
      // Create a new challenge instead of using matches table
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: 'Test Match - ' + new Date().toLocaleTimeString(),
          description: 'Automated test match simulation',
          game_id: (await supabase.from('games').select('id').limit(1).single()).data?.id || '550e8400-e29b-41d4-a716-446655440001',
          creator_id: '00000000-0000-0000-0000-000000000001',
          stake_amount: 5,
          max_participants: 8,
          platform: 'Xbox',
          status: 'open'
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Add test players to the challenge
      const testPlayers = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002', 
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004'
      ];

      const participants = testPlayers.map(playerId => ({
        challenge_id: challenge.id,
        user_id: playerId,
        stake_paid: 5,
        status: 'joined'
      }));

      await supabase.from('challenge_participants').insert(participants);

      // Update challenge to in_progress
      await supabase
        .from('challenges')
        .update({ 
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', challenge.id);

      toast({
        title: "Test Challenge Created",
        description: `Created challenge ${challenge.id} with ${testPlayers.length} test players`,
      });

      return challenge.id;
    } catch (error) {
      console.error('Simulate match flow error:', error);
      toast({
        title: "Error",
        description: `Failed to simulate challenge: ${String(error)}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const completeWithResults = async (payoutType: 'TOP_3' | 'WINNER_TAKE_ALL') => {
    setBusy(true);
    try {
      // Find the latest in_progress challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challenge) {
        throw new Error('No active test challenge found');
      }

      // Get participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challenge.id);

      if (!participants || participants.length === 0) {
        throw new Error('No participants found for challenge');
      }

      // Pick a random winner
      const randomWinner = participants[Math.floor(Math.random() * participants.length)];

      // Complete the challenge
      await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          winner_id: randomWinner.user_id,
          end_time: new Date().toISOString()
        })
        .eq('id', challenge.id);

      // Simulate payout manually since we don't have the full automation
      const totalPot = participants.length * challenge.stake_amount;
      const winnerPayout = totalPot * 0.9; // 10% platform fee

      await supabase.rpc('increment_wallet_balance', {
        user_id_param: randomWinner.user_id,
        amount_param: winnerPayout
      });

      toast({
        title: "Challenge Completed",
        description: `Winner: ${randomWinner.user_id.slice(-4)} won $${winnerPayout.toFixed(2)}`,
      });

    } catch (error) {
      console.error('Complete challenge error:', error);
      toast({
        title: "Error",
        description: `Failed to complete challenge: ${String(error)}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const simulateFailure = async () => {
    setBusy(true);
    try {
      // Find the latest in_progress challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challenge) {
        throw new Error('No active test challenge found');
      }

      // Get participants for refunds
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id, stake_paid')
        .eq('challenge_id', challenge.id);

      // Refund all participants
      for (const participant of participants || []) {
        await supabase.rpc('increment_wallet_balance', {
          user_id_param: participant.user_id,
          amount_param: participant.stake_paid
        });
      }

      // Mark challenge as cancelled
      await supabase
        .from('challenges')
        .update({ 
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', challenge.id);

      toast({
        title: "Challenge Failed - Refunds Processed",
        description: `Refunded ${participants?.length || 0} participants`,
      });

    } catch (error) {
      console.error('Simulate failure error:', error);
      toast({
        title: "Error", 
        description: `Failed to simulate failure: ${String(error)}`,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-yellow-500/20 bg-yellow-50/5 dark:bg-yellow-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <Zap className="w-5 h-5" />
          🧪 Match Automation Simulator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the automated match flow with simulated players and results
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button 
            onClick={simulateMatchFlow}
            disabled={busy}
            className="flex items-center gap-2"
            variant="default"
          >
            <Users className="w-4 h-4" />
            Start New Match
          </Button>
          
          <Button 
            onClick={() => completeWithResults('TOP_3')}
            disabled={busy}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Trophy className="w-4 h-4" />
            Complete (Top 3)
          </Button>
          
          <Button 
            onClick={() => completeWithResults('WINNER_TAKE_ALL')}
            disabled={busy}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Trophy className="w-4 h-4" />
            Complete (Winner Take All)
          </Button>
          
          <Button 
            onClick={simulateFailure}
            disabled={busy}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <AlertTriangle className="w-4 h-4" />
            Simulate Crash
          </Button>
          
          <Button 
            onClick={() => callEdgeFunction('watchdog-refund-failures')}
            disabled={busy}
            className="flex items-center gap-2"
            variant="secondary"
          >
            <Play className="w-4 h-4" />
            Run Watchdog
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>⚠️ Development Tool:</strong> This panel simulates the complete match lifecycle 
            including player joining, match execution, result processing, and automated payouts. 
            Remove from production builds.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}