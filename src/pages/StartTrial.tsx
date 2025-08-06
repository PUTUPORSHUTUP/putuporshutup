import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const StartTrial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const startTrialProcess = async () => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start your free trial.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('create-premium-subscription');

        if (error) {
          console.error('Subscription error:', error);
          toast({
            title: "Subscription Error",
            description: error.message || "Unable to start free trial.",
            variant: "destructive",
          });
          navigate('/vip-required');
          return;
        }

        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          navigate('/vip-required');
        }
      } catch (error) {
        console.error('Free trial error:', error);
        toast({
          title: "Trial Error", 
          description: "Internal error while starting trial.",
          variant: "destructive",
        });
        navigate('/vip-required');
      }
    };

    startTrialProcess();
  }, [user, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Starting Your Free Trial...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you to checkout.</p>
      </div>
    </div>
  );
};

export default StartTrial;