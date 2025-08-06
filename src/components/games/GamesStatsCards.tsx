import { Card, CardContent } from '@/components/ui/card';
import { Trophy, DollarSign, Users, Gamepad2 } from 'lucide-react';

interface Game {
  id: string;
}

interface Wager {
  total_pot: number;
  participant_count: number;
}

interface GamesStatsCardsProps {
  wagers: Wager[];
  games: Game[];
}

export const GamesStatsCards = ({ wagers, games }: GamesStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{wagers.length}</p>
            <p className="text-sm text-muted-foreground">Active Challenges</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              ${wagers.reduce((sum, w) => sum + w.total_pot, 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Pot</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {wagers.reduce((sum, w) => sum + w.participant_count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Players</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-full">
            <Gamepad2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{games.length}</p>
            <p className="text-sm text-muted-foreground">Games Available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};