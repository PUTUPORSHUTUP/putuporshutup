import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useResponsibleGambling } from '@/hooks/useResponsibleGambling';
import { ResponsibleGamblingWarning } from './ResponsibleGamblingWarning';
import { ShareButton } from '@/components/ui/share-button';
import { ChallengeForm } from './ChallengeForm';
import { StatLoggingService } from '@/services/statLoggingService';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
}

interface CreateChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGame: Game | null;
  onChallengeCreated: () => void;
}

export const CreateChallengeModal = ({ 
  open, 
  onOpenChange, 
  selectedGame, 
  onChallengeCreated 
}: CreateChallengeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isExcluded, exclusionMessage } = useResponsibleGambling();

  // Load games on mount
  useEffect(() => {
    const loadGames = async () => {
      const { data } = await supabase
        .from('games')
        .select('id, name, display_name, description, platform')
        .eq('is_active', true);
      
      if (data) {
        setGames(data);
      }
    };
    
    if (open) {
      loadGames();
    }
  }, [open]);

  const handleSubmit = async (formData: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a challenge",
        variant: "destructive",
      });
      return;
    }

    if (isExcluded) {
      toast({
        title: "Account Restricted",
        description: exclusionMessage || "You are currently excluded from wagering activities.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('market_matches')
        .insert({
          title: formData.title,
          description: formData.description,
          stake_amount: parseFloat(formData.stake_amount),
          game_id: formData.game_id,
          platform: formData.platform,
          max_participants: formData.max_participants,
          challenge_type: formData.challenge_type,
          verification_method: formData.verification_method,
          custom_rules: formData.custom_rules,
          creator_id: user.id,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      // Log challenge creation
      StatLoggingService.logChallengeCreation(
        user.id,
        data.id,
        formData.game_id,
        formData.platform,
        parseFloat(formData.stake_amount)
      );

      toast({
        title: "Challenge Created!",
        description: "Your challenge has been created successfully.",
      });

      onChallengeCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isExcluded) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <ResponsibleGamblingWarning 
            isExcluded={isExcluded}
            exclusionMessage={exclusionMessage}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="animate-fade-in-up">Create New Challenge</DialogTitle>
          <div className="flex items-center gap-2 animate-fade-in-up animation-delay-100">
            <ShareButton />
          </div>
        </DialogHeader>
        
        <div className="animate-fade-in-up animation-delay-200">
          <ChallengeForm
            games={games}
            selectedGame={selectedGame}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};