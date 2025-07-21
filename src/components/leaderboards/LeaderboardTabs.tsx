import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardCard } from './LeaderboardCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  DollarSign, 
  Target, 
  TrendingUp, 
  Calendar,
  Crown,
  Gamepad2,
  Award
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  value: number;
  change?: number;
  is_premium?: boolean;
}

export const LeaderboardTabs = () => {
  const [allTimeWinnings, setAllTimeWinnings] = useState<LeaderboardEntry[]>([]);
  const [winRatio, setWinRatio] = useState<LeaderboardEntry[]>([]);
  const [totalWins, setTotalWins] = useState<LeaderboardEntry[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<LeaderboardEntry[]>([]);
  const [recentWinners, setRecentWinners] = useState<LeaderboardEntry[]>([]);
  const [tournamentChampions, setTournamentChampions] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAllTimeWinnings(),
        loadWinRatio(),
        loadTotalWins(),
        loadMonthlyEarnings(),
        loadRecentWinners(),
        loadTournamentChampions()
      ]);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTimeWinnings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, total_wagered, is_premium')
      .order('total_wagered', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAllTimeWinnings(data.map((profile, index) => ({
        rank: index + 1,
        user_id: profile.user_id,
        username: profile.username || '',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        value: profile.total_wagered || 0,
        is_premium: profile.is_premium
      })));
    }
  };

  const loadWinRatio = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, total_wins, total_losses, is_premium')
      .gt('total_wins', 0)
      .order('total_wins', { ascending: false })
      .limit(10);

    if (!error && data) {
      setWinRatio(data.map((profile, index) => {
        const totalGames = (profile.total_wins || 0) + (profile.total_losses || 0);
        const ratio = totalGames > 0 ? ((profile.total_wins || 0) / totalGames) * 100 : 0;
        
        return {
          rank: index + 1,
          user_id: profile.user_id,
          username: profile.username || '',
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          value: ratio,
          is_premium: profile.is_premium
        };
      }).sort((a, b) => b.value - a.value).map((entry, index) => ({ ...entry, rank: index + 1 })));
    }
  };

  const loadTotalWins = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, total_wins, is_premium')
      .order('total_wins', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTotalWins(data.map((profile, index) => ({
        rank: index + 1,
        user_id: profile.user_id,
        username: profile.username || '',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        value: profile.total_wins || 0,
        is_premium: profile.is_premium
      })));
    }
  };

  const loadMonthlyEarnings = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        user_id,
        amount,
        profiles!inner(username, display_name, avatar_url, is_premium)
      `)
      .eq('type', 'wager_payout')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    if (!error && data) {
      const userEarnings = data.reduce((acc: Record<string, any>, transaction: any) => {
        const userId = transaction.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            username: transaction.profiles.username || '',
            display_name: transaction.profiles.display_name,
            avatar_url: transaction.profiles.avatar_url,
            value: 0,
            is_premium: transaction.profiles.is_premium
          };
        }
        acc[userId].value += transaction.amount;
        return acc;
      }, {});

      const sortedEarnings = Object.values(userEarnings)
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10)
        .map((entry: any, index) => ({ ...entry, rank: index + 1 }));

      setMonthlyEarnings(sortedEarnings as LeaderboardEntry[]);
    }
  };

  const loadRecentWinners = async () => {
    const { data: wagers, error } = await supabase
      .from('wagers')
      .select('winner_id, total_pot, end_time')
      .not('winner_id', 'is', null)
      .not('end_time', 'is', null)
      .order('end_time', { ascending: false })
      .limit(10);

    if (!error && wagers) {
      const winnerIds = wagers.map(w => w.winner_id).filter(Boolean);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_premium')
        .in('user_id', winnerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setRecentWinners(wagers.map((wager, index) => {
        const profile = profileMap.get(wager.winner_id!);
        return {
          rank: index + 1,
          user_id: wager.winner_id!,
          username: profile?.username || '',
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          value: wager.total_pot || 0,
          is_premium: profile?.is_premium
        };
      }));
    }
  };

  const loadTournamentChampions = async () => {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('winner_id, prize_pool, title')
      .not('winner_id', 'is', null)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && tournaments) {
      const winnerIds = tournaments.map(t => t.winner_id).filter(Boolean);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_premium')
        .in('user_id', winnerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setTournamentChampions(tournaments.map((tournament, index) => {
        const profile = profileMap.get(tournament.winner_id!);
        return {
          rank: index + 1,
          user_id: tournament.winner_id!,
          username: profile?.username || '',
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          value: tournament.prize_pool || 0,
          is_premium: profile?.is_premium
        };
      }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            LEADERBOARDS & RANKINGS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="earnings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              <TabsTrigger value="earnings">💰 Earnings</TabsTrigger>
              <TabsTrigger value="wins">🏆 Wins</TabsTrigger>
              <TabsTrigger value="ratio">📊 Win %</TabsTrigger>
              <TabsTrigger value="monthly">📅 Monthly</TabsTrigger>
              <TabsTrigger value="recent">⚡ Recent</TabsTrigger>
              <TabsTrigger value="tournaments">👑 Tournaments</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="earnings">
                <LeaderboardCard
                  title="All-Time Highest Earners"
                  entries={allTimeWinnings}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  icon={DollarSign}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="wins">
                <LeaderboardCard
                  title="Most Wins"
                  entries={totalWins}
                  valueFormatter={(value) => `${value} wins`}
                  icon={Trophy}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="ratio">
                <LeaderboardCard
                  title="Best Win Percentage"
                  entries={winRatio}
                  valueFormatter={(value) => `${value.toFixed(1)}%`}
                  icon={Target}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="monthly">
                <LeaderboardCard
                  title="This Month's Top Earners"
                  entries={monthlyEarnings}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  icon={Calendar}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="recent">
                <LeaderboardCard
                  title="Recent Winners"
                  entries={recentWinners}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  icon={TrendingUp}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="tournaments">
                <LeaderboardCard
                  title="Tournament Champions"
                  entries={tournamentChampions}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  icon={Crown}
                  loading={loading}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};