import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, Users, Trophy, Clock } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
  image_url: string;
  is_active: boolean;
}

interface GameMode {
  id: string;
  game_id: string;
  mode_name: string;
  mode_description: string;
  max_players: number;
  is_active: boolean;
}

interface EnhancedGameSelectorProps {
  onGameSelect: (game: Game, mode: GameMode) => void;
  selectedPlatform?: string;
}

const EnhancedGameSelector = ({ onGameSelect, selectedPlatform }: EnhancedGameSelectorProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [gameModes, setGameModes] = useState<{ [gameId: string]: GameMode[] }>({});
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamesAndModes();
  }, []);

  const fetchGamesAndModes = async () => {
    try {
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (gamesError) throw gamesError;

      // Fetch game modes
      const { data: modesData, error: modesError } = await supabase
        .from('game_modes')
        .select('*')
        .eq('is_active', true)
        .order('mode_name');

      if (modesError) throw modesError;

      // Group modes by game_id
      const modesByGame: { [gameId: string]: GameMode[] } = {};
      modesData?.forEach((mode) => {
        if (!modesByGame[mode.game_id]) {
          modesByGame[mode.game_id] = [];
        }
        modesByGame[mode.game_id].push(mode);
      });

      setGames(gamesData || []);
      setGameModes(modesByGame);
    } catch (error) {
      console.error('Error fetching games and modes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = selectedPlatform
    ? games.filter(game => game.platform?.includes(selectedPlatform))
    : games;

  const handleGameSelect = (game: Game) => {
    setSelectedGameId(game.id);
    setSelectedMode(null);
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    const selectedGame = games.find(g => g.id === selectedGameId);
    if (selectedGame) {
      onGameSelect(selectedGame, mode);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Games Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Choose Your Game
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <Card 
              key={game.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedGameId === game.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleGameSelect(game)}
            >
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img
                  src={game.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'}
                  alt={game.display_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">
                    {gameModes[game.id]?.length || 0} modes
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-base">{game.display_name}</CardTitle>
                <CardDescription className="text-sm">
                  {game.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1 mt-2">
                  {game.platform?.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Game Modes */}
      {selectedGameId && gameModes[selectedGameId] && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Game Mode
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameModes[selectedGameId].map((mode) => (
              <Card
                key={mode.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMode?.id === mode.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleModeSelect(mode)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-base flex items-center justify-between">
                    {mode.mode_name}
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {mode.max_players}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {mode.mode_description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedGameId && selectedMode && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">
                  {games.find(g => g.id === selectedGameId)?.display_name} - {selectedMode.mode_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Ready to create wager for up to {selectedMode.max_players} players
                </p>
              </div>
              <Button size="sm" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Create Wager
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedGameSelector;