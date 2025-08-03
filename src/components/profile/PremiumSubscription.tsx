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
  const [loading, setLoading] = useState({ basic: false, premium: false });
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, basic: true }));
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

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Complete your subscription in the new tab.",
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Unable to process subscription request.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, basic: false }));
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

  const subscriptionFeatures = [
    { icon: Zap, title: "Access to $10+ Matches", description: "Compete in high-stakes VIP matches and tournaments" },
    { icon: Trophy, title: "Premium Tournament Access", description: "Enter exclusive tournaments with bigger prizes" },
    { icon: Star, title: "Priority Support", description: "Get priority customer service" },
    { icon: Shield, title: "7-Day Free Trial", description: "Try it risk-free for a full week" },
    { icon: Crown, title: "VIP Badge", description: "Special recognition and status" }
  ];

  const isSubscribed = currentSubscription?.subscribed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">VIP Membership</h2>
        <p className="text-muted-foreground">Unlock $10+ matches with 7-day free trial</p>
      </div>

      {/* Current Status */}
      {isSubscribed && (
        <div className="p-4 bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-600">Subscription Active</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentSubscription?.current_period_end && (
              <>Renews on {new Date(currentSubscription.current_period_end * 1000).toLocaleDateString()}</>
            )}
            {currentSubscription?.cancel_at_period_end && (
              <span className="text-yellow-600"> (Cancels at period end)</span>
            )}
          </p>
          <Button 
            onClick={checkSubscriptionStatus}
            disabled={checking}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Check Status"
            )}
          </Button>
        </div>
      )}

      {/* Single Subscription Card */}
      <div className="max-w-md mx-auto">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">7-DAY FREE TRIAL</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Crown className="w-6 h-6 text-primary" />
              VIP Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$9.99</div>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="text-xs text-primary font-medium mt-1">Start with 7 days FREE</p>
            </div>

            <div className="space-y-3">
              {subscriptionFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleSubscribe}
              disabled={loading.basic || isSubscribed}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading.basic ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {isSubscribed ? "Currently Subscribed" : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Free trial for 7 days, then $9.99/month. Cancel anytime. No hidden fees.
      </p>
    </div>
  );
};