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
    const startVipTrial = async () => {
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
        // Use the existing database function to start VIP trial
        const { error } = await supabase.rpc('start_vip_trial', {
          user_id_param: user.id
        });

        if (error) {
          console.error('VIP trial error:', error);
          toast({
            title: "Trial Error",
            description: "Error starting trial. Please contact support.",
            variant: "destructive",
          });
          navigate('/vip-required');
          return;
        }

        toast({
          title: "🔥 VIP Trial Activated!",
          description: "You now have premium access for 7 days!",
        });
        navigate('/vip');
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

    startVipTrial();
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