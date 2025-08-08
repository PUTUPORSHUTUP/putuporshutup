import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play, Users, Trophy, AlertTriangle, Zap } from "lucide-react";

export function AdminSimPanel() {
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(profile?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (loading) {
    return (
      <Card className="border-neutral-500/20">
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null; // Hide completely for non-admins
  }

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

  const runSimulation = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('sim_runner', {
        body: { manual: true }
      });
      
      if (error) throw error;
      
      toast({
        title: "Simulation Complete",
        description: `Challenge: ${data.challengeId || "n/a"} | Crashed: ${String(data.crashed)}`,
      });
      
      console.log('Simulation result:', data);
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const forceReset = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('force_reset_sim', {
        body: {}
      });
      
      if (error) throw error;
      
      toast({
        title: "Force Reset Complete",
        description: `Reset challenge: ${data.resetChallengeId || "none found"}`,
      });
      
      console.log('Reset result:', data);
    } catch (error: any) {
      console.error('Reset error:', error);
      toast({
        title: "Reset Failed",
        description: error.message || "Unknown error", 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={runSimulation}
            disabled={busy}
            className="flex items-center gap-2"
            variant="default"
          >
            <Play className="w-4 h-4" />
            {busy ? "Running..." : "Run One Simulation Now"}
          </Button>
          
          <Button 
            onClick={forceReset}
            disabled={busy}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <AlertTriangle className="w-4 h-4" />
            🧹 Force Reset (Refund & Unlock)
          </Button>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• Creates test challenges with 8 players</p>
          <p>• 20% chance of simulated crash (auto-refund)</p>
          <p>• 80% chance of completion with TOP_3 payouts (50/30/20)</p>
          <p>• All transactions logged with full audit trail</p>
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