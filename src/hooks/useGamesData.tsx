import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
  image_url?: string;
  is_active: boolean;
}

interface WagerParticipant {
  user_id: string;
  stake_paid: number;
  joined_at: string;
}

interface Wager {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  stake_amount: number;
  max_participants: number;
  platform: string;
  game_mode: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  total_pot: number;
  winner_id?: string | null;
  created_at: string;
  game: Game;
  participant_count: number;
  user_participated?: boolean;
  wager_participants: WagerParticipant[];
  wager_type?: string;
  team_size?: number;
  lobby_id?: string;
  stat_criteria?: any;
  verification_method?: string;
}

export const useGamesData = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [filteredWagers, setFilteredWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedWagerType, setSelectedWagerType] = useState('all');
  
  const { user } = useAuth();

  // Filter wagers by type
  useEffect(() => {
    if (selectedWagerType === 'all') {
      setFilteredWagers(wagers);
    } else {
      const filtered = wagers.filter(wager => 
        (wager.wager_type || '1v1') === selectedWagerType
      );
      setFilteredWagers(filtered);
    }
  }, [wagers, selectedWagerType]);

  // Set up subscriptions and load data
  useEffect(() => {
    loadGames();
    loadWagers();
    loadUserBalance();
    
    // Set up real-time subscriptions
    const wagerChannel = supabase
      .channel('wagers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wagers'
      }, () => {
        loadWagers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wager_participants'
      }, () => {
        loadWagers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(wagerChannel);
    };
  }, []);

  const loadUserBalance = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', user.id)
      .single();
      
    setUserBalance(data?.wallet_balance || 0);
  };

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      setGames(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadWagers = async () => {
    try {
      // Get all wagers with participant data
      const { data: allWagers, error: wagersError } = await supabase
        .from('challenges')
        .select(`
          *,
          game:games(*),
          participant_count:challenge_participants(count),
          challenge_participants(user_id, stake_paid, joined_at)
        `)
        .in('status', ['open', 'in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (wagersError) {
        console.error('Error loading wagers:', wagersError);
        return;
      }

      // Then check which wagers the current user participates in
      let userParticipations: string[] = [];
      if (user) {
        const { data: participations } = await supabase
        .from('challenge_participants')
          .select('challenge_id')
          .eq('user_id', user.id);
        
        userParticipations = participations?.map(p => p.challenge_id) || [];
      }

      const wagersWithCount = (allWagers as any)?.map((wager: any) => ({
        ...wager,
        participant_count: wager.participant_count?.[0]?.count || 0,
        user_participated: userParticipations.includes(wager.id),
        status: wager.status as 'open' | 'in_progress' | 'completed' | 'cancelled',
        challenge_participants: wager.challenge_participants || []
      })) || [];

      setWagers(wagersWithCount as Wager[]);
      setFilteredWagers(wagersWithCount as Wager[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate wager counts by type
  const getWagerCounts = () => {
    const counts: Record<string, number> = {
      all: wagers.length,
      '1v1': wagers.filter(w => !w.wager_type || w.wager_type === '1v1').length,
      'team_vs_team': wagers.filter(w => w.wager_type === 'team_vs_team').length,
      'lobby_competition': wagers.filter(w => w.wager_type === 'lobby_competition').length,
      'stat_based': wagers.filter(w => w.wager_type === 'stat_based').length
    };
    return counts;
  };

  return {
    games,
    wagers,
    filteredWagers,
    loading,
    userBalance,
    selectedWagerType,
    setSelectedWagerType,
    loadWagers,
    loadUserBalance,
    getWagerCounts
  };
};