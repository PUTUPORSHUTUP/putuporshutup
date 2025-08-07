import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: string;
  name: string;
  display_name: string;
}

export default function AllGamesDropdown({ onSelect }: { onSelect: (game: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, display_name')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (game: Game) => {
    setSelected(game.display_name);
    onSelect(game.name);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <button
        className="w-full px-4 py-3 text-left border border-border rounded-md bg-background shadow-sm hover:bg-muted transition-colors flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        <span className="text-foreground">
          🎮 {selected || (loading ? 'Loading games...' : 'Select Game')}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute w-full bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto mt-2 z-[9999] overflow-visible">
          {games.map((game) => (
            <li
              key={game.id}
              onClick={() => handleSelect(game)}
              className="px-4 py-2 hover:bg-muted cursor-pointer text-foreground transition-colors first:rounded-t-md last:rounded-b-md"
            >
              {game.display_name}
            </li>
          ))}
          {games.length === 0 && !loading && (
            <li className="px-4 py-2 text-muted-foreground text-center">
              No games available
            </li>
          )}
        </ul>
      )}
    </div>
  );
}