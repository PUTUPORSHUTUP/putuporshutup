import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatLoggingService } from '@/services/statLoggingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Target, TrendingUp, Activity, Calendar, Gamepad2 } from 'lucide-react';

interface GameStats {
  game_name: string;
  total_matches: number;
  wins: number;
  win_rate: number;
  avg_stake: number;
  total_earnings: number;
}

interface RecentActivity {
  id: string;
  game_name: string;
  created_at: string;
  stats_data: any;
}

export const PlayerStatsDisplay = () => {
  const { user } = useAuth();
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [totalStats, setTotalStats] = useState({
    total_matches: 0,
    total_wins: 0,
    challenges_created: 0,
    win_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPlayerStats();
    }
  }, [user]);

  const loadPlayerStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get overall stats summary
      const summary = await StatLoggingService.getPlayerStatsSummary(user.id);
      if (summary) {
        setTotalStats({
          total_matches: summary.total_matches,
          total_wins: summary.wins,
          challenges_created: summary.challenges_created,
          win_rate: summary.total_matches > 0 ? (summary.wins / summary.total_matches) * 100 : 0
        });
        setRecentActivity(summary.recent_activity || []);
      }

      // Get game-specific stats
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (statsData) {
        // Group by game and calculate stats
        const gameStatsMap = new Map<string, {
          total_matches: number;
          wins: number;
          total_stake: number;
          total_earnings: number;
        }>();

        statsData.forEach((stat) => {
          const gameName = stat.game_name;
          const existing = gameStatsMap.get(gameName) || {
            total_matches: 0,
            wins: 0,
            total_stake: 0,
            total_earnings: 0
          };

          existing.total_matches++;
          
          const statsData = stat.stats_data as any;
          if (statsData?.match_result?.includes('1st') || 
              statsData?.match_result?.toLowerCase().includes('won')) {
            existing.wins++;
          }

          if (statsData?.stake_amount) {
            existing.total_stake += parseFloat(statsData.stake_amount);
          }

          gameStatsMap.set(gameName, existing);
        });

        const gameStatsArray: GameStats[] = Array.from(gameStatsMap.entries()).map(([game_name, stats]) => ({
          game_name,
          total_matches: stats.total_matches,
          wins: stats.wins,
          win_rate: stats.total_matches > 0 ? (stats.wins / stats.total_matches) * 100 : 0,
          avg_stake: stats.total_matches > 0 ? stats.total_stake / stats.total_matches : 0,
          total_earnings: stats.total_earnings
        }));

        setGameStats(gameStatsArray.sort((a, b) => b.total_matches - a.total_matches));
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    } finally {
      setLoading(false);
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
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Gamepad2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{totalStats.total_matches}</div>
            <div className="text-sm text-muted-foreground">Total Matches</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{totalStats.total_wins}</div>
            <div className="text-sm text-muted-foreground">Total Wins</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalStats.win_rate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{totalStats.challenges_created}</div>
            <div className="text-sm text-muted-foreground">Challenges Created</div>
          </CardContent>
        </Card>
      </div>

      {/* Game-Specific Stats */}
      {gameStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Game Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gameStats.map((game, index) => (
                <div key={game.game_name} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{game.game_name}</h4>
                      <Badge variant="secondary">{game.total_matches} matches</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Wins: </span>
                        <span className="font-medium text-green-600">{game.wins}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Win Rate: </span>
                        <span className="font-medium">{game.win_rate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Stake: </span>
                        <span className="font-medium">${game.avg_stake.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rank: </span>
                        <span className="font-medium">#{index + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{activity.game_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(activity.stats_data as any)?.activity_type === 'challenge_created' && 'Created challenge'}
                        {(activity.stats_data as any)?.activity_type === 'challenge_joined' && 'Joined challenge'}
                        {(activity.stats_data as any)?.match_result && `Match result: ${(activity.stats_data as any).match_result}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Stats Message */}
      {gameStats.length === 0 && recentActivity.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Gaming Stats Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start playing challenges to see your detailed gaming statistics here!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};