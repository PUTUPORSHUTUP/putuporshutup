import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const GamertagWarning = () => {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGamertag = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('xbox_gamertag')
          .eq('user_id', user.id)
          .single();

        setShowWarning(!profile?.xbox_gamertag);
      } catch (error) {
        console.error('Error checking gamertag:', error);
      } finally {
        setLoading(false);
      }
    };

    checkGamertag();
  }, [user]);

  if (loading || !user || !showWarning) {
    return null;
  }

  return (
    <div className="w-full bg-red-900 text-center text-red-300 py-2 text-sm font-bold">
      ⚠️ Please link your gamertag before joining matches.
    </div>
  );
};