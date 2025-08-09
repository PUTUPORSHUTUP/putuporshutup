import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AnimatedCard, AnimatedListItem, AnimatedCounter } from '@/components/ui/animated-components';

interface MatchStatistics {
  totalMatches: number;
  activeMatches: number;
  completedMatches: number;
  disputedMatches: number;
  totalVolume: number;
  averageStake: number;
  completionRate: number;
  disputeRate: number;
  topGames: Array<{ name: string; count: number; volume: number }>;
  platforms: Array<{ name: string; percentage: number }>;
  timeRanges: Array<{ period: string; matches: number; volume: number }>;
}

interface AdminMatchStatisticsProps {
  statistics: MatchStatistics;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export const AdminMatchStatistics = ({
  statistics,
  timeframe,
  onTimeframeChange
}: AdminMatchStatisticsProps) => {
  const statCards = [
    {
      title: 'Total Matches',
      value: statistics.totalMatches,
      icon: <Target className="w-4 h-4" />,
      trend: '+12%',
      positive: true
    },
    {
      title: 'Active Matches',
      value: statistics.activeMatches,
      icon: <Clock className="w-4 h-4 animate-pulse" />,
      trend: '+5%',
      positive: true
    },
    {
      title: 'Total Volume',
      value: `$${statistics.totalVolume.toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4" />,
      trend: '+18%',
      positive: true
    },
    {
      title: 'Avg. Stake',
      value: `$${statistics.averageStake.toFixed(2)}`,
      icon: <TrendingUp className="w-4 h-4" />,
      trend: '+3%',
      positive: true
    },
    {
      title: 'Completion Rate',
      value: `${statistics.completionRate.toFixed(1)}%`,
      icon: <CheckCircle className="w-4 h-4" />,
      trend: '-2%',
      positive: false
    },
    {
      title: 'Dispute Rate',
      value: `${statistics.disputeRate.toFixed(2)}%`,
      icon: <AlertCircle className="w-4 h-4" />,
      trend: '-0.5%',
      positive: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <AnimatedCard className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Match Statistics</h3>
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => onTimeframeChange(period)}
                className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  timeframe === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <AnimatedListItem key={stat.title} index={index}>
            <Card className="hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <Badge 
                    className={`text-xs ${
                      stat.positive 
                        ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                        : 'bg-red-500/10 text-red-600 border-red-500/20'
                    }`}
                  >
                    {stat.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {typeof stat.value === 'number' ? (
                      <AnimatedCounter value={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Games */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Games
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.topGames.map((game, index) => (
              <AnimatedListItem key={game.name} index={index} staggerDelay={50}>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium">{game.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {game.count} matches
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-money-green">
                      ${game.volume.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">volume</div>
                  </div>
                </div>
              </AnimatedListItem>
            ))}
          </CardContent>
        </AnimatedCard>

        {/* Platform Distribution */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.platforms.map((platform, index) => (
              <AnimatedListItem key={platform.name} index={index} staggerDelay={50}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-muted-foreground">
                      {platform.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${platform.percentage}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                  </div>
                </div>
              </AnimatedListItem>
            ))}
          </CardContent>
        </AnimatedCard>

        {/* Time Analysis */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statistics.timeRanges.map((range, index) => (
              <AnimatedListItem key={range.period} index={index} staggerDelay={50}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <div>
                    <div className="font-medium">{range.period}</div>
                    <div className="text-sm text-muted-foreground">
                      {range.matches} matches
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${range.volume.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${(range.volume / range.matches).toFixed(0)} avg
                    </div>
                  </div>
                </div>
              </AnimatedListItem>
            ))}
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <AnimatedCard className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Quick Actions</h4>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
              Export Report
            </button>
            <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
              Schedule Report
            </button>
            <button className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
};