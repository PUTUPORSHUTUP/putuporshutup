import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  value: number;
  change?: number; // Position change from last period
  is_premium?: boolean;
}

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  valueFormatter: (value: number) => string;
  icon: React.ComponentType<any>;
  loading?: boolean;
}

export const LeaderboardCard = ({ 
  title, 
  entries, 
  valueFormatter, 
  icon: Icon, 
  loading = false 
}: LeaderboardCardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getChangeIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    return change > 0 
      ? <TrendingUp className="w-3 h-3 text-green-500" />
      : <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/20";
      default:
        return "hover:bg-muted/50";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-6 h-6 bg-muted rounded" />
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-muted rounded mb-1" />
                  <div className="w-16 h-3 bg-muted rounded" />
                </div>
                <div className="w-16 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rankings yet</p>
              <p className="text-sm">Start playing to appear on the leaderboard!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${getRankStyle(entry.rank)}`}
              >
                {/* Rank */}
                <div className="flex items-center gap-1 min-w-[2rem]">
                  {getRankIcon(entry.rank)}
                  {entry.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {getChangeIcon(entry.change)}
                      {entry.change !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Math.abs(entry.change)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar_url} />
                  <AvatarFallback>
                    {(entry.display_name || entry.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {entry.display_name || entry.username || 'Anonymous'}
                    </p>
                    {entry.is_premium && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  {entry.username && entry.display_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      @{entry.username}
                    </p>
                  )}
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="font-bold text-sm">
                    {valueFormatter(entry.value)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};