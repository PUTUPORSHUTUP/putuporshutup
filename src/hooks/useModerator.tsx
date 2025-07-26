import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useModerator = () => {
  const { user } = useAuth();
  const [isModerator, setIsModerator] = useState(false);
  const [userRole, setUserRole] = useState<string>('player');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsModerator(false);
      setUserRole('player');
      setLoading(false);
      return;
    }

    const checkModeratorStatus = async () => {
      try {
        // Check if user has moderator or admin role
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['mod', 'admin']);

        if (error) {
          console.error('Error checking moderator status:', error);
          setIsModerator(false);
          setUserRole('player');
        } else {
          const isModOrAdmin = roleData && roleData.length > 0;
          setIsModerator(isModOrAdmin);
          
          // Get highest priority role
          if (roleData && roleData.length > 0) {
            const roles = roleData.map(r => r.role);
            if (roles.includes('admin')) {
              setUserRole('admin');
            } else if (roles.includes('mod')) {
              setUserRole('mod');
            } else {
              setUserRole('player');
            }
          } else {
            setUserRole('player');
          }
        }
      } catch (error) {
        console.error('Error in checkModeratorStatus:', error);
        setIsModerator(false);
        setUserRole('player');
      } finally {
        setLoading(false);
      }
    };

    checkModeratorStatus();
  }, [user]);

  return { isModerator, userRole, loading };
};