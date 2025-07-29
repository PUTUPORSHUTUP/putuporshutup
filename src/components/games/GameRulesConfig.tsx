import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Clock, 
  Users, 
  Target, 
  Camera, 
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  GamepadIcon
} from 'lucide-react';

interface GameMatrixData {
  id: string;
  game: string;
  platforms: string;
  challenge_type: string;
  max_players: number;
  proof_method: string;
  api_access: boolean;
  automated_score_detection: boolean;
  auto_forfeit_minutes: number;
  game_modes: any;
  result_options: any;
  allowed_proof_types: any;
  setup_instructions: string;
  detailed_notes: string;
  trend_score: number;
}

export const GameRulesConfig = () => {
  const [games, setGames] = useState<GameMatrixData[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGameMatrix();
  }, []);

  const loadGameMatrix = async () => {
    try {
      const { data, error } = await supabase
        .from('game_matrix')
        .select('*')
        .order('trend_score', { ascending: false });

      if (error) throw error;
      setGames(data as GameMatrixData[] || []);
      if (data && data.length > 0) {
        setSelectedGame(data[0] as GameMatrixData);
      }
    } catch (error) {
      console.error('Error loading game matrix:', error);
      toast({
        title: "Error",
        description: "Failed to load game configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProofMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'api': return 'bg-green-100 text-green-800 border-green-200';
      case 'manual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hybrid': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Game Rules & Configuration Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game List */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-3">Available Games</h3>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => setSelectedGame(game)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedGame?.id === game.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{game.game}</div>
                          <div className="text-sm text-muted-foreground">
                            {game.platforms}
                          </div>
                        </div>
                        <Badge 
                          variant="outline"
                          className={getProofMethodColor(game.proof_method)}
                        >
                          {game.proof_method}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Game Details */}
            <div className="lg:col-span-2">
              {selectedGame ? (
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="setup">Setup</TabsTrigger>
                    <TabsTrigger value="automation">Automation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <GamepadIcon className="w-5 h-5" />
                          {selectedGame.game}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Max Players: {selectedGame.max_players}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Type: {selectedGame.challenge_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Forfeit: {selectedGame.auto_forfeit_minutes}min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedGame.api_access ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">API Access</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Platforms</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedGame.platforms.split(',').map((platform, index) => (
                              <Badge key={index} variant="secondary">
                                {platform.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {selectedGame.game_modes && Array.isArray(selectedGame.game_modes) && selectedGame.game_modes.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Game Modes</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedGame.game_modes.map((mode: string, index) => (
                                <Badge key={index} variant="outline">
                                  {mode}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Game Rules & Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Proof Method: {selectedGame.proof_method}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(selectedGame.allowed_proof_types) && selectedGame.allowed_proof_types.map((type: string, index) => (
                              <Badge key={index} variant="secondary">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {selectedGame.result_options && Array.isArray(selectedGame.result_options) && selectedGame.result_options.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Result Options</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedGame.result_options.map((option: string, index) => (
                                <Badge key={index} variant="outline">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedGame.detailed_notes && (
                          <div>
                            <h4 className="font-medium mb-2">Detailed Notes</h4>
                            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                              {selectedGame.detailed_notes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="setup" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Setup Instructions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedGame.setup_instructions ? (
                          <div className="prose text-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-muted-foreground p-4 bg-muted/50 rounded-lg">
                              {selectedGame.setup_instructions}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No setup instructions available for this game.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="automation" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Automation Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Automated Score Detection</span>
                            {selectedGame.automated_score_detection ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">API Integration</span>
                            {selectedGame.api_access ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Trend Score</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(selectedGame.trend_score, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-blue-900">
                              {selectedGame.trend_score}/100
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <GamepadIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a game to view its configuration</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};