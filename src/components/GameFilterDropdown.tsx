import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: string;
  name: string;
  display_name: string;
}

interface MatchQueueItem {
  id: string;
  game_id: string;
  platform: string;
  queue_status: string;
  stake_amount: number;
  user_id: string;
  queued_at: string;
  games?: Game;
}

export default function GameFilterDropdown({ onFilter }: { onFilter: (game: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGamesFromQueue();

    // Set up real-time subscription
    const channel = supabase
      .channel('match-queue-games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_queue' },
        () => loadGamesFromQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGamesFromQueue = async () => {
    try {
      setLoading(true);
      
      // Get unique games from active match queue entries
      const { data: queueData, error: queueError } = await supabase
        .from('match_queue')
        .select(`
          game_id,
          games!inner (
            id,
            name,
            display_name
          )
        `)
        .eq('queue_status', 'searching');

      if (queueError) throw queueError;

      // Extract unique games
      const uniqueGames = queueData?.reduce((acc: Game[], item) => {
        const game = item.games as Game;
        if (game && !acc.find(g => g.id === game.id)) {
          acc.push(game);
        }
        return acc;
      }, []) || [];

      setGames(uniqueGames);
    } catch (error) {
      console.error('Error loading games from queue:', error);
      toast({
        title: "Error",
        description: "Failed to load games from queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (game: Game | null) => {
    if (game) {
      setSelected(game.display_name);
      onFilter(game.name);
    } else {
      setSelected(null);
      onFilter(null);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <button
        className="w-full px-4 py-3 text-left border border-border rounded-md bg-background shadow-sm hover:bg-muted transition-colors flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <span className="text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {selected ? `${selected}` : (loading ? 'Loading...' : 'Filter by Game')}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute w-full bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto mt-2 z-[9999]">
          <li
            onClick={() => handleSelect(null)}
            className={`px-4 py-2 hover:bg-muted cursor-pointer transition-colors first:rounded-t-md ${
              !selected ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'
            }`}
          >
            Show All Games
          </li>
          {games.map((game) => (
            <li
              key={game.id}
              onClick={() => handleSelect(game)}
              className={`px-4 py-2 hover:bg-muted cursor-pointer transition-colors ${
                selected === game.display_name ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'
              }`}
            >
              {game.display_name}
            </li>
          ))}
          {games.length === 0 && !loading && (
            <li className="px-4 py-2 text-muted-foreground text-center">
              No games in queue
            </li>
          )}
        </ul>
      )}
    </div>
  );
}