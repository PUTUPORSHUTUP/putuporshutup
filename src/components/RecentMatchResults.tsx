import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MatchResult {
  id: string;
  game_name: string;
  winner_gamertag: string;
  payout: number;
  created_at: string;
}

export const RecentMatchResults = () => {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecentWinners();
  }, []);

  const loadRecentWinners = async () => {
    try {
      // First, let's try to get recent challenge results
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          created_at,
          winner_id,
          total_pot,
          games!challenges_game_id_fkey(display_name),
          profiles!challenges_winner_id_fkey(xbox_gamertag, display_name)
        `)
        .not('winner_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedResults: MatchResult[] = (data || []).map(item => ({
        id: item.id,
        game_name: (item.games as any)?.display_name || 'Unknown Game',
        winner_gamertag: (item.profiles as any)?.xbox_gamertag || (item.profiles as any)?.display_name || 'Unknown Player',
        payout: item.total_pot || 0,
        created_at: item.created_at
      }));

      setResults(formattedResults);
    } catch (err) {
      setError('Error loading recent winners');
      console.error('Error fetching recent winners:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-black text-white px-4 py-6">
        <h2 className="text-xl font-bold text-green-400 mb-4">🏆 Recent Match Results</h2>
        <div className="text-sm text-gray-400">Loading recent winners...</div>
      </section>
    );
  }

  return (
    <section className="bg-black text-white px-4 py-6">
      <h2 className="text-xl font-bold text-green-400 mb-4">🏆 Recent Match Results</h2>
      <div className="space-y-3 text-sm">
        {error ? (
          <p className="text-red-400">Error loading winners.</p>
        ) : results.length === 0 ? (
          <p className="text-gray-400">No recent match results found.</p>
        ) : (
          results.map((result) => (
            <div key={result.id} className="bg-gray-800 p-3 rounded shadow">
              🎮 <strong>{result.game_name}</strong> | 🥇 {result.winner_gamertag} won ${result.payout}
            </div>
          ))
        )}
      </div>
    </section>
  );
};