import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { calculateMatchEligibility } from '@/lib/walletValidation';
import { getActiveDemoMatch } from '@/lib/demo';

export default function SmartBanner() {
  const { user } = useAuth();
  const [banner, setBanner] = useState<JSX.Element | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      // Check if there's an active demo match first
      const demoMatch = await getActiveDemoMatch();

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('xbox_gamertag, wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) return;

      if (!profile.xbox_gamertag) {
        setBanner(
          <Alert className="border-destructive/50 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Link your Xbox gamertag to join automated matches.{' '}
              <Link to="/profile" className="underline hover:no-underline font-semibold">
                Link now
              </Link>
            </AlertDescription>
          </Alert>
        );
      } else if (!demoMatch) {
        // PUOSU Wallet System - Smart Banner Logic
        const balance = profile.wallet_balance ?? 0;
        const eligibility = calculateMatchEligibility(balance);
        
        if (eligibility.bannerMessage) {
          const isError = eligibility.bannerType === 'error';
          setBanner(
            <Alert className={isError ? "border-destructive/50 text-destructive" : "border-yellow-500/50 text-yellow-700 dark:text-yellow-300"}>
              {isError ? <AlertTriangle className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {eligibility.bannerMessage}
                  {eligibility.availableMatches.length > 0 && (
                    <span className="ml-2 text-sm opacity-80">
                      Available: ${eligibility.availableMatches.join(', $')} matches
                    </span>
                  )}
                </span>
                <Button asChild size="sm" variant={isError ? "destructive" : "outline"}>
                  <Link to="/wallet">Top Up Wallet</Link>
                </Button>
              </AlertDescription>
            </Alert>
          );
        }
      }
    };

    checkProfile();
  }, [user]);

  return banner;
}