import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const VIPSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No payment session found",
        variant: "destructive"
      });
      navigate('/vip');
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-vip-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data?.success) {
        setSuccess(true);
        toast({
          title: "VIP Activated!",
          description: "Your VIP status has been activated successfully",
        });
      } else {
        throw new Error(data?.message || "Payment verification failed");
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Error",
        description: "There was an issue verifying your payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we activate your VIP status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {success ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">VIP Activated!</h2>
              <p className="text-muted-foreground mb-6">
                Congratulations! Your VIP status has been activated and you now have access to all premium features.
              </p>
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority match making</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Exclusive tournaments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Advanced statistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">VIP support</span>
                </div>
              </div>
              <Button onClick={() => navigate('/profile')} className="w-full">
                Go to Profile
              </Button>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">✕</span>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Issue</h2>
              <p className="text-muted-foreground mb-6">
                There was an issue with your payment verification. Please contact support for assistance.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/vip')} variant="outline" className="w-full">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/')} className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VIPSuccess;