import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isChallengePastTimeout, CHALLENGE_TIMEOUT_HOURS } from '@/lib/feeCalculator';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TimeoutHandlerProps {
  challengeId: string;
  createdAt: string;
  status: string;
  onRefundIssued?: () => void;
}

export const TimeoutHandler = ({ challengeId, createdAt, status, onRefundIssued }: TimeoutHandlerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const updateTimer = () => {
      if (status !== 'open') {
        setTimeRemaining('');
        return;
      }

      const challengeTime = new Date(createdAt);
      const expiryTime = new Date(challengeTime.getTime() + (CHALLENGE_TIMEOUT_HOURS * 60 * 60 * 1000));
      const now = new Date();
      const timeLeft = expiryTime.getTime() - now.getTime();

      if (timeLeft <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [createdAt, status]);

  const handleAutoRefund = async () => {
    if (!user || !isExpired) return;

    setProcessingRefund(true);
    try {
      // Call refund endpoint
      const { data, error } = await supabase.functions.invoke('create-tilled-payment', {
        body: {
          type: 'refund',
          chargeId: challengeId, // This would need to be the actual charge ID
          reason: 'timeout_auto_refund'
        }
      });

      if (error) {
        toast({
          title: "Refund Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Auto-Refund Processed",
        description: "Challenge fee has been automatically refunded due to timeout.",
      });

      onRefundIssued?.();
    } catch (error) {
      console.error('Auto-refund error:', error);
      toast({
        title: "Refund Error",
        description: "Unable to process automatic refund.",
        variant: "destructive",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  if (status !== 'open' || !timeRemaining) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isExpired ? (
        <>
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expired
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoRefund}
            disabled={processingRefund}
            className="text-xs"
          >
            {processingRefund ? 'Processing...' : 'Auto-Refund'}
          </Button>
        </>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeRemaining} left
        </Badge>
      )}
    </div>
  );
};