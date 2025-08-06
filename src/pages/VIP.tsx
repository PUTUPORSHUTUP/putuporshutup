import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PremiumSubscription } from '@/components/profile/PremiumSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Star, Zap, Calendar, Shield, Trophy } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VIP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<string>('Checking trial status...');
  const [trialData, setTrialData] = useState<{ trialStart?: string; isActive?: boolean; daysLeft?: number } | null>(null);

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
        await checkTrialStatus();
      } catch (error) {
        console.error('Error checking VIP access:', error);
        navigate('/vip-required');
      } finally {
        setLoading(false);
      }
    };

    const checkTrialStatus = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('trial_start, is_vip_trial, is_premium')
          .eq('user_id', user!.id)
          .single();

        if (error || !profile) {
          setTrialStatus('VIP Trial not active.');
          return;
        }

        if (profile.is_premium) {
          setTrialStatus('✅ Full VIP Member - Unlimited access');
          setTrialData({ isActive: true });
          return;
        }

        if (!profile.trial_start || !profile.is_vip_trial) {
          setTrialStatus('VIP Trial not active.');
          return;
        }

        const startDate = new Date(profile.trial_start);
        const now = new Date();
        const diffTime = Math.max(0, now.getTime() - startDate.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 7 - daysPassed);

        setTrialData({ trialStart: profile.trial_start, isActive: daysLeft > 0, daysLeft });

        if (daysLeft <= 0) {
          setTrialStatus('❌ Trial expired.');
        } else {
          setTrialStatus(`✅ Trial active — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.`);
        }
      } catch (error) {
        console.error('Error checking trial status:', error);
        setTrialStatus('Error checking trial status.');
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
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3 flex items-center justify-center gap-2">
            <Crown className="h-8 w-8" />
            VIP Access Unlocked
          </h1>
          <p className="text-muted-foreground text-sm">
            Welcome to your exclusive trial. You've unlocked priority features, bigger match potential, and first access to what's coming next.
          </p>
        </div>

        {/* Trial Status */}
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-accent flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trial Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-card-foreground">
              {trialStatus}
            </p>
            {trialData?.daysLeft !== undefined && trialData.daysLeft <= 0 && (
              <div className="mt-3">
                <Button 
                  onClick={() => navigate('/vip-required')} 
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VIP Perks List */}
        <Card className="bg-muted/30 shadow">
          <CardHeader>
            <CardTitle className="text-xl text-accent flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              VIP Perks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Priority Access to Match Queue
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Access to Sunday Showdown Challenges
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Early Access to $10+ Matches (Coming Soon)
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                VIP Badge & Leaderboard Highlighting
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Reserved Slots in Future Tournament Drops
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to keep your VIP perks after the trial ends?
          </p>
          <Button 
            onClick={() => navigate('/vip-required')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-bold"
          >
            Upgrade to Full VIP
          </Button>
        </div>

        {/* Premium Subscription Management */}
        <PremiumSubscription onSubscriptionUpdate={() => window.location.reload()} />
      </div>
    </div>
  );
};

export default VIP;