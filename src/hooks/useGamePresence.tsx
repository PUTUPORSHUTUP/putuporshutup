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

      // Fetch all presence data with profile info
      const { data: presenceData, error: presenceError } = await supabase
        .from('game_presence')
        .select(`
          *,
          profiles!inner(xbox_gamertag, display_name)
        `)
        .eq('is_online', true)
        .order('last_seen_at', { ascending: false });

      if (presenceError) {
        console.error('Error fetching presence data:', presenceError);
        throw presenceError;
      }

      const formattedPresence = (presenceData || []).map(item => ({
        user_id: item.user_id,
        xbox_xuid: item.xbox_xuid,
        current_game: item.current_game,
        game_title_id: item.game_title_id,
        activity_state: item.activity_state,
        last_seen_at: item.last_seen_at,
        is_online: item.is_online,
        xbox_gamertag: item.profiles?.xbox_gamertag,
        display_name: item.profiles?.display_name
      }));

      setAllPresence(formattedPresence);

      // Find current user's presence
      const currentUserPresence = formattedPresence.find(p => p.user_id === user.id);
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
        table: 'game_presence'
      }, () => {
        // Refresh on any database changes
        fetchPresenceData();
      })
      .subscribe();

    // Set up periodic refresh every 5 minutes
    const refreshInterval = setInterval(refreshPresence, 5 * 60 * 1000);

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