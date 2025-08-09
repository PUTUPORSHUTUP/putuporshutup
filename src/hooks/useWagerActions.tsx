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
      
      // Get the current session for JWT authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        return;
      }

      // Check wallet balance from profiles
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

      console.log('Attempting to join wager with secure authentication:', {
        wagerId,
        userId: user.id,
        stakeAmount,
        userBalance: profile.wallet_balance
      });

      // Call the secure atomic join function with proper authentication
      const { data, error: joinError } = await supabase.functions.invoke('join-challenge-atomic', {
        body: {
          challengeId: wagerId,
          userId: user.id,
          stakeAmount: stakeAmount
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (joinError) {
        console.error('Edge function error:', joinError);
        let errorMessage = "Failed to join wager";
        
        // Handle specific error cases
        if (joinError.message) {
          switch (joinError.message) {
            case 'insufficient_balance':
              errorMessage = "Insufficient wallet balance to join this wager";
              break;
            case 'already_joined':
              errorMessage = "You have already joined this wager";
              break;
            case 'challenge_not_available':
              errorMessage = "This wager is no longer available";
              break;
            case 'challenge_full':
              errorMessage = "This wager is full";
              break;
            case 'rate_limit_exceeded':
              errorMessage = "Too many attempts. Please try again in a few minutes";
              break;
            default:
              errorMessage = joinError.message.includes('Unauthorized') 
                ? "Your session has expired. Please log in again"
                : joinError.message || errorMessage;
          }
        }
        
        toast({
          title: "Error joining wager",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!data?.ok) {
        toast({
          title: "Error joining wager",
          description: data?.error || "Unknown error occurred",
          variant: "destructive",
        });
        return;
      }

      // Find the wager for stat logging
      const wager = wagers.find(w => w.id === wagerId);
      if (wager) {
        // Log challenge participation silently
        try {
          await StatLoggingService.logChallengeParticipation(
            user.id,
            wagerId,
            wager.game?.display_name || 'Unknown Game',
            wager.platform,
            stakeAmount
          );
        } catch (statError) {
          console.warn('Failed to log participation stats:', statError);
          // Don't fail the join operation due to logging issues
        }
      }

      toast({
        title: "Successfully Joined!",
        description: `You've joined the ${wager?.game?.display_name || 'wager'} for $${stakeAmount}!`,
      });

      // Refresh data
      onSuccess();
      
    } catch (error) {
      console.error('Error joining wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while joining the wager.",
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