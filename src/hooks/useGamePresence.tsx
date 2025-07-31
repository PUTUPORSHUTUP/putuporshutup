import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GamePresence {
  user_id: string;
  xbox_xuid: string;
  current_game: string | null;
  game_title_id: string | null;
  activity_state: string;
  last_seen_at: string;
  is_online: boolean;
  xbox_gamertag?: string;
  display_name?: string;
}

interface UseGamePresenceReturn {
  userPresence: GamePresence | null;
  allPresence: GamePresence[];
  isLoading: boolean;
  error: string | null;
  refreshPresence: () => Promise<void>;
}

export const useGamePresence = (): UseGamePresenceReturn => {
  const [userPresence, setUserPresence] = useState<GamePresence | null>(null);
  const [allPresence, setAllPresence] = useState<GamePresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPresenceData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create mock presence data from profiles with Xbox linkage
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, xbox_gamertag, display_name, xbox_xuid')
        .not('xbox_xuid', 'is', null)
        .limit(20);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Transform profiles to presence format - simulating live data
      const mockPresence: GamePresence[] = (profiles || []).map(profile => ({
        user_id: profile.user_id,
        xbox_xuid: profile.xbox_xuid || '',
        current_game: Math.random() > 0.7 ? ['Call of Duty', 'Fortnite', 'NBA 2K25', 'Madden 25'][Math.floor(Math.random() * 4)] : null,
        game_title_id: null,
        activity_state: Math.random() > 0.5 ? 'playing' : 'online',
        last_seen_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        is_online: Math.random() > 0.3,
        xbox_gamertag: profile.xbox_gamertag,
        display_name: profile.display_name
      }));

      // Filter to only show online users
      const onlinePresence = mockPresence.filter(p => p.is_online);
      setAllPresence(onlinePresence);

      // Find current user's presence
      const currentUserPresence = mockPresence.find(p => p.user_id === user.id);
      setUserPresence(currentUserPresence || null);

    } catch (err) {
      console.error('Presence fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch presence data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPresence = async () => {
    await fetchPresenceData();
  };

  useEffect(() => {
    fetchPresenceData();

    // Set up real-time subscription for presence updates
    const channel = supabase
      .channel('game_activity')
      .on('broadcast', { event: 'presence_update' }, (payload) => {
        const updatedPresence = payload.payload as GamePresence;
        
        // Update all presence list
        setAllPresence(prev => {
          const filtered = prev.filter(p => p.user_id !== updatedPresence.user_id);
          if (updatedPresence.is_online) {
            return [...filtered, updatedPresence].sort((a, b) => 
              new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
            );
          }
          return filtered;
        });

        // Update user's own presence if it's their update
        if (user && updatedPresence.user_id === user.id) {
          setUserPresence(updatedPresence.is_online ? updatedPresence : null);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        // Refresh on profile changes
        fetchPresenceData();
      })
      .subscribe();

    // Set up periodic refresh every 5 minutes to simulate live updates
    const refreshInterval = setInterval(() => {
      fetchPresenceData();
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [user]);

  return {
    userPresence,
    allPresence,
    isLoading,
    error,
    refreshPresence
  };
};