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
              You haven't linked your Xbox gamertag yet.{' '}
              <Link to="/profile" className="underline hover:no-underline">
                Link now
              </Link>{' '}
              to join matches.
            </AlertDescription>
          </Alert>
        );
      } else if ((profile.wallet_balance ?? 0) < 5) {
        setBanner(
          <Alert className="border-warning/50 text-warning">
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Your wallet balance is low.{' '}
              <Link to="/wallet" className="underline hover:no-underline">
                Add funds
              </Link>{' '}
              to stay in the game.
            </AlertDescription>
          </Alert>
        );
      }
    };

    checkProfile();
  }, [user]);

  return banner;
}