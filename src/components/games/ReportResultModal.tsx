import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PayoutDisclaimerModal } from './PayoutDisclaimerModal';

interface WagerParticipant {
  user_id: string;
  stake_paid: number;
  joined_at: string;
}

interface Wager {
  id: string;
  title: string;
  creator_id: string;
  total_pot: number;
  status: string;
  wager_participants?: WagerParticipant[];
}

interface ReportResultModalProps {
  wager: Wager;
  currentUserId: string;
  onResultReported: () => void;
}

export const ReportResultModal = ({ wager, currentUserId, onResultReported }: ReportResultModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { toast } = useToast();

  // Get all participants including the creator
  const allParticipants = [
    { user_id: wager.creator_id, stake_paid: 0, joined_at: '', isCreator: true },
    ...(wager.wager_participants || []).map(p => ({ ...p, isCreator: false }))
  ];

  // Check if current user is a participant
  const isParticipant = allParticipants.some(p => p.user_id === currentUserId);

  if (!isParticipant || wager.status !== 'in_progress') {
    return null;
  }

  const handleInitialSubmit = () => {
    if (!selectedWinner) {
      toast({
        title: "Select Winner",
        description: "Please select who won the match.",
        variant: "destructive"
      });
      return;
    }
    
    setShowDisclaimer(true);
  };

  const handleConfirmResult = async () => {
    setShowDisclaimer(false);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('report-wager-result', {
        body: {
          wager_id: wager.id,
          winner_id: selectedWinner
        }
      });

      if (error) throw error;

      toast({
        title: "Result Reported!",
        description: data.message,
      });

      setOpen(false);
      onResultReported();
    } catch (error: any) {
      console.error('Error reporting result:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to report result",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDisclaimer = () => {
    setShowDisclaimer(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
          <Trophy className="w-4 h-4 mr-2" />
          Report Match Result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Report Match Result
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{wager.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  ${wager.total_pot} Total Pot
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {allParticipants.length} Players
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Who won the match?</h3>
            
            {allParticipants.map((participant) => (
              <Card 
                key={participant.user_id}
                className={`cursor-pointer transition-all ${
                  selectedWinner === participant.user_id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedWinner(participant.user_id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {participant.isCreator ? 'CR' : 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {participant.user_id === currentUserId ? 'You' : 'Player'}
                        </span>
                        {participant.isCreator && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Stake: ${participant.stake_paid || wager.total_pot / allParticipants.length}
                      </p>
                    </div>
                    <div className="w-4 h-4 border-2 rounded-full border-primary">
                      {selectedWinner === participant.user_id && (
                        <div className="w-full h-full bg-primary rounded-full scale-50" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important:</p>
                <p className="text-xs mt-1">
                  All participants need to report the same winner. If there's disagreement, 
                  the wager creator will need to resolve the dispute.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleInitialSubmit}
            disabled={!selectedWinner || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reporting Result...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Submit Result
              </>
            )}
          </Button>
        </div>

      </DialogContent>
      
      <PayoutDisclaimerModal
        open={showDisclaimer}
        onConfirm={handleConfirmResult}
        onCancel={handleCancelDisclaimer}
      />
    </Dialog>
  );
};