import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface MatchQueueItem {
  id: string;
  game_id: string;
  platform: string;
  queue_status: string;
  stake_amount: number;
  user_id: string;
  queued_at: string;
}

export const MatchFilter = () => {
  const [matches, setMatches] = useState<MatchQueueItem[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchQueueItem[]>([]);
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, gameFilter, modeFilter]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('match_queue')
        .select('*')
        .order('queued_at', { ascending: false });

      if (error) throw error;
      
      setMatches(data || []);
    } catch (err) {
      setError('Error loading matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = matches;

    if (gameFilter !== 'all') {
      filtered = filtered.filter(match => match.game_id === gameFilter);
    }

    if (modeFilter !== 'all') {
      filtered = filtered.filter(match => match.platform === modeFilter);
    }

    setFilteredMatches(filtered);
  };

  if (loading) {
    return (
      <div className="w-full p-4">
        <p className="text-center text-muted-foreground">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 p-4">
      {/* Filter Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Game Filter</label>
          <Select value={gameFilter} onValueChange={setGameFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="cod">Call of Duty</SelectItem>
              <SelectItem value="apex">Apex Legends</SelectItem>
              <SelectItem value="rocket-league">Rocket League</SelectItem>
              <SelectItem value="fortnite">Fortnite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px]">
          <label className="block text-sm font-medium mb-2">Platform Filter</label>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="xbox">Xbox</SelectItem>
              <SelectItem value="playstation">PlayStation</SelectItem>
              <SelectItem value="pc">PC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Match Results */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Active Matches ({filteredMatches.length})
        </h3>
        
        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {filteredMatches.length === 0 && !error ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-center">
                No matches found with current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((match) => (
            <Card key={match.id} className="bg-secondary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{match.platform} — ${match.stake_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{match.queue_status}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Queued: {new Date(match.queued_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};