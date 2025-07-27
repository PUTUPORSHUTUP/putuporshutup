import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  RefreshCw, 
  AlertTriangle,
  Target,
  Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameAnalytics {
  id: string;
  name: string;
  display_name: string;
  revenue_7d: number;
  revenue_30d: number;
  total_challenges: number;
  avg_stake: number;
  trend_score: number;
  performance_rank: number;
  is_trending: boolean;
  replacement_candidate: boolean;
}

interface TrendingGame {
  name: string;
  display_name: string;
  platform: string[];
  trend_score: number;
  estimated_revenue_potential: number;
  player_count: number;
}

export const GamePerformanceAnalytics = () => {
  const [gameAnalytics, setGameAnalytics] = useState<GameAnalytics[]>([]);
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGameAnalytics = async () => {
    try {
      // Get current games with revenue data
      const { data: challenges } = await supabase
        .from('challenges')
        .select(`
          game_id,
          stake_amount,
          total_pot,
          created_at,
          status,
          games(name, display_name)
        `)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Process analytics
      const gameMap = new Map<string, any>();
      
      challenges?.forEach(challenge => {
        const gameId = challenge.game_id;
        if (!gameMap.has(gameId)) {
          gameMap.set(gameId, {
            id: gameId,
            name: challenge.games?.name,
            display_name: challenge.games?.display_name,
            revenue_7d: 0,
            revenue_30d: 0,
            total_challenges: 0,
            stakes: []
          });
        }
        
        const game = gameMap.get(gameId);
        const challengeDate = new Date(challenge.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        game.total_challenges++;
        game.stakes.push(challenge.stake_amount);
        game.revenue_30d += challenge.total_pot * 0.1; // 10% platform fee
        
        if (daysDiff <= 7) {
          game.revenue_7d += challenge.total_pot * 0.1;
        }
      });

      // Calculate final metrics
      const analytics: GameAnalytics[] = Array.from(gameMap.values()).map((game, index) => ({
        ...game,
        avg_stake: game.stakes.length > 0 ? game.stakes.reduce((a: number, b: number) => a + b, 0) / game.stakes.length : 0,
        trend_score: calculateTrendScore(game),
        performance_rank: index + 1,
        is_trending: game.revenue_7d > game.revenue_30d / 4,
        replacement_candidate: game.revenue_30d < 50 && game.total_challenges < 5
      }));

      // Sort by revenue performance
      analytics.sort((a, b) => b.revenue_30d - a.revenue_30d);
      analytics.forEach((game, index) => {
        game.performance_rank = index + 1;
      });

      setGameAnalytics(analytics);
    } catch (error) {
      console.error('Error fetching game analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch game analytics",
        variant: "destructive"
      });
    }
  };

  const fetchTrendingGames = async () => {
    // Simulate fetching from gaming trend APIs
    // In production, you'd integrate with Steam API, Twitch API, etc.
    const mockTrendingGames: TrendingGame[] = [
      {
        name: "apex_legends",
        display_name: "Apex Legends",
        platform: ["PC", "PlayStation", "Xbox"],
        trend_score: 95,
        estimated_revenue_potential: 850,
        player_count: 100000000
      },
      {
        name: "fortnite",
        display_name: "Fortnite",
        platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
        trend_score: 92,
        estimated_revenue_potential: 920,
        player_count: 400000000
      },
      {
        name: "valorant",
        display_name: "Valorant",
        platform: ["PC"],
        trend_score: 88,
        estimated_revenue_potential: 780,
        player_count: 23000000
      },
      {
        name: "warzone",
        display_name: "Call of Duty: Warzone",
        platform: ["PC", "PlayStation", "Xbox"],
        trend_score: 85,
        estimated_revenue_potential: 720,
        player_count: 85000000
      },
      {
        name: "rocket_league",
        display_name: "Rocket League",
        platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
        trend_score: 82,
        estimated_revenue_potential: 650,
        player_count: 75000000
      }
    ];

    setTrendingGames(mockTrendingGames);
  };

  const calculateTrendScore = (game: any) => {
    const revenueWeight = 0.4;
    const challengeWeight = 0.3;
    const growthWeight = 0.3;
    
    const revenueScore = Math.min(game.revenue_30d / 100, 10) * 10;
    const challengeScore = Math.min(game.total_challenges / 10, 10) * 10;
    const growthScore = game.revenue_7d > 0 ? Math.min((game.revenue_7d * 4) / game.revenue_30d * 100, 100) : 0;
    
    return Math.round(revenueScore * revenueWeight + challengeScore * challengeWeight + growthScore * growthWeight);
  };

  const optimizeGamesList = async () => {
    setLoading(true);
    try {
      // Identify games to replace (bottom performers)
      const replacementCandidates = gameAnalytics
        .filter(game => game.replacement_candidate)
        .slice(-5); // Bottom 5 worst performers

      // Get top trending games not already in our list
      const currentGameNames = gameAnalytics.map(g => g.name);
      const newGamesToAdd = trendingGames
        .filter(game => !currentGameNames.includes(game.name))
        .slice(0, replacementCandidates.length);

      if (newGamesToAdd.length > 0) {
        // Add new trending games
        const { error: insertError } = await supabase
          .from('games')
          .insert(
            newGamesToAdd.map(game => ({
              name: game.name,
              display_name: game.display_name,
              platform: game.platform,
              is_active: true
            }))
          );

        if (insertError) throw insertError;

        // Deactivate poor performers
        if (replacementCandidates.length > 0) {
          const { error: updateError } = await supabase
            .from('games')
            .update({ is_active: false })
            .in('id', replacementCandidates.map(g => g.id));

          if (updateError) throw updateError;
        }

        toast({
          title: "Games List Optimized",
          description: `Added ${newGamesToAdd.length} trending games and removed ${replacementCandidates.length} underperformers`,
        });

        // Refresh data
        await fetchGameAnalytics();
        setLastUpdated(new Date());
      } else {
        toast({
          title: "No Optimization Needed",
          description: "Current games list is already optimized",
        });
      }
    } catch (error) {
      console.error('Error optimizing games list:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize games list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameAnalytics();
    fetchTrendingGames();
  }, []);

  const worstPerformers = gameAnalytics.slice(-5);
  const topPerformers = gameAnalytics.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Game Performance Analytics</h2>
          <p className="text-muted-foreground">Revenue-based game optimization and trending analysis</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchGameAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={optimizeGamesList} disabled={loading} size="sm">
            <Target className="h-4 w-4 mr-2" />
            Optimize Games List
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Last optimization: {lastUpdated.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top Revenue Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>30d Revenue</TableHead>
                <TableHead>7d Revenue</TableHead>
                <TableHead>Challenges</TableHead>
                <TableHead>Avg Stake</TableHead>
                <TableHead>Trend Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPerformers.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {game.is_trending && <TrendingUp className="h-4 w-4 text-green-500" />}
                      <span className="font-medium">{game.display_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${game.revenue_30d.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${game.revenue_7d.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>{game.total_challenges}</TableCell>
                  <TableCell>${game.avg_stake.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={game.trend_score > 70 ? "default" : "secondary"}>
                      {game.trend_score}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Replacement Candidates */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-500" />
            Replacement Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>30d Revenue</TableHead>
                <TableHead>Challenges</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worstPerformers.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>{game.display_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-red-500" />
                      ${game.revenue_30d.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>{game.total_challenges}</TableCell>
                  <TableCell>
                    {game.replacement_candidate ? (
                      <Badge variant="destructive">Replace</Badge>
                    ) : (
                      <Badge variant="secondary">Monitor</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {game.replacement_candidate && (
                      <Button size="sm" variant="outline">
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trending Games to Add */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Trending Games - Revenue Potential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Trend Score</TableHead>
                <TableHead>Est. Revenue Potential</TableHead>
                <TableHead>Player Base</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trendingGames.slice(0, 10).map((game) => (
                <TableRow key={game.name}>
                  <TableCell className="font-medium">{game.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="default">{game.trend_score}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      ${game.estimated_revenue_potential}/month
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {(game.player_count / 1000000).toFixed(1)}M
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {game.platform.slice(0, 2).map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                      {game.platform.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{game.platform.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Add Game
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};