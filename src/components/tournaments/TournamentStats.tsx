import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

interface TournamentStatsProps {
  tournament: {
    id: string;
    title: string;
    current_participants: number;
    max_participants: number;
    prize_pool: number;
    entry_fee: number;
    status: string;
    start_time: string | null;
    created_at: string;
  };
  matches: any[];
  participants: any[];
}

export const TournamentStats = ({ tournament, matches, participants }: TournamentStatsProps) => {
  const participationRate = (tournament.current_participants / tournament.max_participants) * 100;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const totalMatches = matches.length;
  const progressRate = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
  
  const winnerPool = tournament.prize_pool * 0.6; // 60% to winner
  const runnerUpPool = tournament.prize_pool * 0.3; // 30% to runner-up
  const thirdPlacePool = tournament.prize_pool * 0.1; // 10% to third place

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Users className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <Trophy className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Tournament Status */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(tournament.status)}
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(tournament.status)} text-white`}
                >
                  {tournament.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <Target className="w-8 h-8 text-primary/60" />
          </div>
        </CardContent>
      </Card>

      {/* Participation Rate */}
      <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="text-2xl font-bold text-secondary">
                {tournament.current_participants}/{tournament.max_participants}
              </p>
            </div>
            <Users className="w-8 h-8 text-secondary/60" />
          </div>
          <Progress value={participationRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {participationRate.toFixed(0)}% Full
          </p>
        </CardContent>
      </Card>

      {/* Prize Pool */}
      <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prize Pool</p>
              <p className="text-2xl font-bold text-accent">
                ${tournament.prize_pool.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${tournament.entry_fee} per entry
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-accent/60" />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Progress */}
      <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {completedMatches}/{totalMatches}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600/60" />
          </div>
          <Progress value={progressRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {progressRate.toFixed(0)}% Complete
          </p>
        </CardContent>
      </Card>

      {/* Prize Distribution Card */}
      {tournament.status !== 'open' && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-yellow-600" />
              Prize Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg border border-yellow-500/20">
                <Trophy className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-sm text-muted-foreground">1st Place</p>
                <p className="text-2xl font-bold text-yellow-600">${winnerPool.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">60% of prize pool</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-gray-400/10 to-gray-500/5 rounded-lg border border-gray-400/20">
                <Award className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-muted-foreground">2nd Place</p>
                <p className="text-2xl font-bold text-gray-500">${runnerUpPool.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">30% of prize pool</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg border border-orange-500/20">
                <Award className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <p className="text-sm text-muted-foreground">3rd Place</p>
                <p className="text-2xl font-bold text-orange-600">${thirdPlacePool.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">10% of prize pool</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};