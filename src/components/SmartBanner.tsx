import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SmartBanner() {
  const { user } = useAuth();
  const [banner, setBanner] = useState<JSX.Element | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

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
      } else if ((profile.wallet_balance ?? 0) < 5) {
        setBanner(
          <Alert className="border-yellow-500/50 text-yellow-700 dark:text-yellow-300">
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              💸 Your wallet balance is low (${(profile.wallet_balance ?? 0).toFixed(2)}).{' '}
              <Link to="/wallet" className="underline hover:no-underline font-semibold">
                Add funds
              </Link>{' '}
              to stay in automated matches.
            </AlertDescription>
          </Alert>
        );
      }
    };

    checkProfile();
  }, [user]);

  return banner;
}