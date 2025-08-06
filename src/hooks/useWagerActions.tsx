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
    if (!user) return;

    try {
      setJoining(wagerId);
      
      // Check user's wallet balance first
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

      // Check if already joined
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', wagerId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Already Joined",
          description: "You've already joined this wager.",
          variant: "destructive",
        });
        return;
      }

      // Join the wager
      const { error: joinError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: wagerId,
          user_id: user.id,
          stake_paid: stakeAmount
        });

      if (joinError) {
        toast({
          title: "Error joining wager",
          description: joinError.message,
          variant: "destructive",
        });
        return;
      }

      // Update user's wallet balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance - stakeAmount 
        })
        .eq('user_id', user.id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
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
        description: "You've successfully joined the challenge. Good luck!",
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