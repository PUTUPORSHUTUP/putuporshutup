import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const ActiveMatchWarning = () => {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveMatch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: matchStatus } = await supabase
          .from('match_queue')
          .select('queue_status')
          .eq('user_id', user.id)
          .eq('queue_status', 'matched')
          .maybeSingle();

        setShowWarning(!!matchStatus);
      } catch (error) {
        console.error('Error checking active match:', error);
      } finally {
        setLoading(false);
      }
    };

    checkActiveMatch();
  }, [user]);

  if (loading || !user || !showWarning) {
    return null;
  }

  return (
    <div className="w-full bg-yellow-900 text-center text-yellow-300 py-2 text-sm font-semibold">
      ⏳ You're already in a match. Head to dashboard to finish.
    </div>
  );
};