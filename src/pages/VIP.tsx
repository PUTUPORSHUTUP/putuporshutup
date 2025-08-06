import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PremiumSubscription } from '@/components/profile/PremiumSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Star, Zap } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const VIP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVIPAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_vip_access', {
          user_id_param: user.id
        });

        if (error) throw error;

        if (!data) {
          navigate('/vip-required');
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking VIP access:', error);
        navigate('/vip-required');
      } finally {
        setLoading(false);
      }
    };

    checkVIPAccess();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* VIP Welcome Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              Welcome to VIP
            </CardTitle>
            <p className="text-muted-foreground">
              You have exclusive access to premium features and high-stakes matches
            </p>
          </CardHeader>
        </Card>

        {/* VIP Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>High-Stakes Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Access exclusive $10+ matches with bigger prizes and more skilled opponents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Star className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Priority Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                Skip the line with priority matchmaking for faster game starts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Exclusive Tournaments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                VIP-only tournaments with premium prize pools and exclusive rewards.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Premium Subscription Management */}
        <PremiumSubscription onSubscriptionUpdate={() => {}} />
      </div>
    </div>
  );
};

export default VIP;