import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Star, 
  Zap, 
  Trophy, 
  Shield, 
  Loader2,
  Check,
  X
} from 'lucide-react';

interface PremiumSubscriptionProps {
  onSubscriptionUpdate: () => void;
  currentSubscription?: {
    subscribed: boolean;
    status: string;
    current_period_end?: number;
    cancel_at_period_end?: boolean;
  };
}

export const PremiumSubscription = ({ onSubscriptionUpdate, currentSubscription }: PremiumSubscriptionProps) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleUpgradeToPremium = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-premium-subscription');

      if (error) {
        toast({
          title: "Subscription Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Checkout",
          description: "Complete your premium subscription in the new tab.",
        });
      }
    } catch (error) {
      console.error('Premium subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Unable to process subscription request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke('check-premium-subscription');
      
      if (data) {
        onSubscriptionUpdate();
        toast({
          title: "Subscription Updated",
          description: `Status: ${data.status}`,
        });
      }
    } catch (error) {
      console.error('Check subscription error:', error);
    } finally {
      setChecking(false);
    }
  };

  const premiumFeatures = [
    { icon: Zap, title: "50% Off All Fees", description: "Save on every deposit" },
    { icon: Trophy, title: "Exclusive Tournaments", description: "Premium-only competitions" },
    { icon: Star, title: "Priority Entry", description: "Skip the queue in tournaments" },
    { icon: Shield, title: "Premium Support", description: "Priority customer service" },
    { icon: Crown, title: "Elite Status", description: "Special badges and recognition" }
  ];

  const isSubscribed = currentSubscription?.subscribed;
  const subscriptionStatus = currentSubscription?.status;

  return (
    <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-600" />
          Premium Membership
          {isSubscribed && (
            <Badge className="bg-yellow-600 text-white">
              ACTIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        {isSubscribed ? (
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-600">Premium Active</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentSubscription?.current_period_end && (
                <>Renews on {new Date(currentSubscription.current_period_end * 1000).toLocaleDateString()}</>
              )}
              {currentSubscription?.cancel_at_period_end && (
                <span className="text-yellow-600"> (Cancels at period end)</span>
              )}
            </p>
          </div>
        ) : (
          <div className="text-center p-6">
            <Crown className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
            <h3 className="text-xl font-bold mb-2">Unlock Premium Benefits</h3>
            <div className="text-4xl font-bold text-yellow-600 mb-2">$9.99</div>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
        )}

        {/* Premium Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Premium Features:</h4>
          <div className="grid gap-3">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <feature.icon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                {isSubscribed && <Check className="w-4 h-4 text-green-600 ml-auto" />}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleUpgradeToPremium}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Upgrade to Premium
            </Button>
          ) : (
            <Button 
              onClick={checkSubscriptionStatus}
              disabled={checking}
              variant="outline"
              className="w-full"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                "Check Status"
              )}
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};