import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSponsor = () => {
  const { user } = useAuth();
  const [isSponsor, setIsSponsor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSponsor(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkSponsorStatus = async () => {
      try {
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin');

        const userIsAdmin = adminData && adminData.length > 0;
        setIsAdmin(userIsAdmin);

        // Check if user has sponsored any tournaments
        const { data: sponsorData } = await supabase
          .from('sponsor_performance')
          .select('sponsor_name')
          .limit(1);

        // For now, we'll consider any user with access to sponsor data as a sponsor
        // In the future, you might want to add a sponsors table or check user roles
        setIsSponsor(true);

      } catch (error) {
        console.error('Error checking sponsor status:', error);
        setIsSponsor(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSponsorStatus();
  }, [user]);

  return { isSponsor, isAdmin, loading, canAccessSponsorDashboard: isSponsor || isAdmin };
};