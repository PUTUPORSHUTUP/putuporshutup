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

  const handleUpgradeToBasic = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, basic: true }));
    try {
      const { data, error } = await supabase.functions.invoke('create-basic-subscription');

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
          description: "Complete your basic subscription in the new tab.",
        });
      }
    } catch (error) {
      console.error('Basic subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Unable to process subscription request.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, basic: false }));
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, premium: true }));
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
      setLoading(prev => ({ ...prev, premium: false }));
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

  const basicFeatures = [
    { icon: Zap, title: "50% Off Platform Fees", description: "Save on deposits (tournament entries still apply)" },
    { icon: Star, title: "Priority Entry", description: "Skip the queue in tournaments" },
    { icon: Shield, title: "Basic Support", description: "Enhanced customer service" }
  ];

  const premiumFeatures = [
    { icon: Zap, title: "No Platform Fees", description: "Zero fees on deposits (tournament entries still apply)" },
    { icon: Trophy, title: "Exclusive Tournaments", description: "Premium-only competitions" },
    { icon: Star, title: "VIP Priority", description: "First access to everything" },
    { icon: Shield, title: "Premium Support", description: "24/7 priority customer service" },
    { icon: Crown, title: "Elite Status", description: "Special badges and recognition" }
  ];

  const isSubscribed = currentSubscription?.subscribed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Membership</h2>
        <p className="text-muted-foreground">Unlock exclusive benefits and save on fees</p>
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

      {/* Subscription Tiers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Tier */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20 relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-blue-600" />
              Basic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$9.99</div>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>

            <div className="space-y-3">
              {basicFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <feature.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleUpgradeToBasic}
              disabled={loading.basic || isSubscribed}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading.basic ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              {isSubscribed ? "Current Plan" : "Choose Basic"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Tier */}
        <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 border-yellow-500/20 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-yellow-600 text-white px-3 py-1">BEST VALUE</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-600" />
              Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">$19.99</div>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>

            <div className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <feature.icon className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleUpgradeToPremium}
              disabled={loading.premium || isSubscribed}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {loading.premium ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              {isSubscribed ? "Current Plan" : "Choose Premium"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Cancel anytime. No hidden fees.
      </p>
    </div>
  );
};