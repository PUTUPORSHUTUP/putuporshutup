import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

export default function VipTrialBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkVipStatus = async () => {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('vip_trial_start, is_vip')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !profile) return;

      const trialStart = profile.vip_trial_start;
      const isVip = profile.is_vip;

      if (!isVip && trialStart) {
        const daysSince = differenceInDays(new Date(), new Date(trialStart));
        if (daysSince >= 7) {
          setShowBanner(true);
        }
      }
    };

    checkVipStatus();
  }, [user]);

  if (!showBanner) return null;

  return (
    <div className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 text-center text-sm font-semibold">
      🚨 Your VIP trial has expired.{' '}
      <Link 
        to="/vip" 
        className="underline hover:text-purple-200 transition-colors"
      >
        Upgrade now
      </Link>{' '}
      to unlock exclusive matches.
    </div>
  );
}