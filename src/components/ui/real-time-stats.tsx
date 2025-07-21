import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatsData {
  activePlayers: number;
  totalWinnings: number;
  matchesPlayed: number;
}

export const RealTimeStats = () => {
  const [stats, setStats] = useState<StatsData>({
    activePlayers: 0,
    totalWinnings: 0,
    matchesPlayed: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get active players count
      const { count: playersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total winnings from completed wagers
      const { data: completedWagers } = await supabase
        .from('wagers')
        .select('total_pot')
        .eq('status', 'completed');

      const totalWinnings = completedWagers?.reduce((sum, wager) => sum + Number(wager.total_pot), 0) || 0;

      // Get matches played (completed wagers + completed tournament matches)
      const { count: completedWagersCount } = await supabase
        .from('wagers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: completedTournamentMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const matchesPlayed = (completedWagersCount || 0) + (completedTournamentMatches || 0);

      setStats({
        activePlayers: playersCount || 0,
        totalWinnings,
        matchesPlayed
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchStats()
      )
      .subscribe();

    const wagersChannel = supabase
      .channel('wagers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'wagers' }, 
        () => fetchStats()
      )
      .subscribe();

    const matchesChannel = supabase
      .channel('matches-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tournament_matches' }, 
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(wagersChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl font-bold mb-2 text-muted-foreground animate-pulse">...</div>
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="text-4xl font-bold text-primary mb-2">
          {formatNumber(stats.activePlayers)}
        </div>
        <div className="text-muted-foreground">Active Players</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">
          {formatCurrency(stats.totalWinnings)}
        </div>
        <div className="text-muted-foreground">Total Winnings</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {formatNumber(stats.matchesPlayed)}
        </div>
        <div className="text-muted-foreground">Matches Played</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
        <div className="text-muted-foreground">Support</div>
      </div>
    </div>
  );
};