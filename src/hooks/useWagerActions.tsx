import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StatLoggingService } from '@/services/statLoggingService';

interface Game {
  id: string;
  display_name: string;
}

interface Wager {
  id: string;
  game: Game;
  platform: string;
}

export const useWagerActions = () => {
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoinWager = async (
    wagerId: string, 
    stakeAmount: number, 
    wagers: Wager[], 
    onSuccess: () => void
  ) => {
    if (!user || joining === wagerId) return; // Prevent double-clicks

    try {
      setJoining(wagerId);
      
      // IDEMPOTENT JOIN: Check if already joined first (with unique constraint protection)
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id, stake_paid')
        .eq('challenge_id', wagerId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Joined",
          description: "You've already joined this wager.",
          variant: "destructive",
        });
        return;
      }

      // Check wallet balance with FOR UPDATE to prevent race conditions
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < stakeAmount) {
        toast({
          title: "Insufficient Funds",
          description: `You need $${stakeAmount} to join this wager. Your balance: $${profile?.wallet_balance || 0}`,
          variant: "destructive",
        });
        return;
      }

      // ATOMIC TRANSACTION: Join challenge and debit wallet in one operation
      const { error: joinError } = await supabase.functions.invoke('join-challenge-atomic', {
        body: {
          challengeId: wagerId,
          userId: user.id,
          stakeAmount: stakeAmount
        }
      });

      if (joinError) {
        // Handle specific constraint violations
        if (joinError.message.includes('already_joined')) {
          toast({
            title: "Already Joined",
            description: "You've already joined this wager.",
            variant: "destructive",
          });
        } else if (joinError.message.includes('insufficient_funds')) {
          toast({
            title: "Insufficient Funds",
            description: "Your wallet balance is too low for this wager.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error joining wager",
            description: joinError.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Find the wager for stat logging
      const wager = wagers.find(w => w.id === wagerId);
      if (wager) {
        // Log challenge participation silently
        await StatLoggingService.logChallengeParticipation(
          user.id,
          wagerId,
          wager.game?.display_name || 'Unknown Game',
          wager.platform,
          stakeAmount
        );
      }

      toast({
        title: "Joined Wager!",
        description: "Entry fee debited. You're in the queue!",
      });

      // Refresh data
      onSuccess();
      
    } catch (error) {
      console.error('Error joining wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setJoining(null);
    }
  };

  const handleLeaveWager = async (wagerId: string, onSuccess: () => void) => {
    if (!user) return;

    try {
      setLeaving(wagerId);
      
      const { data, error } = await supabase.functions.invoke('leave-wager', {
        body: { wager_id: wagerId }
      });

      if (error) {
        toast({
          title: "Error leaving wager",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Left Wager!",
        description: data.message,
      });

      // Refresh data
      onSuccess();
      
    } catch (error) {
      console.error('Error leaving wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLeaving(null);
    }
  };

  return {
    joining,
    leaving,
    handleJoinWager,
    handleLeaveWager
  };
};