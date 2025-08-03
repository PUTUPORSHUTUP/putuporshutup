import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, DollarSign, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  platform: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string | null;
  start_date?: string;
  created_at: string;
  game: {
    id: string;
    display_name: string;
    name: string;
  };
}

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {tournament.game.display_name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {tournament.platform}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{tournament.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tournament Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="font-bold text-green-600">${tournament.entry_fee}</p>
              <p className="text-xs text-muted-foreground">Entry Fee</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="font-bold text-yellow-600">${tournament.prize_pool}</p>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold">
                {tournament.current_participants}/{tournament.max_participants}
              </p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <div>
              <p className="font-bold">Open</p>
              <p className="text-xs text-muted-foreground">Status</p>
            </div>
          </div>
        </div>

        {/* Start Time */}
        {(tournament.start_time || tournament.start_date) && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              Starts: {new Date(tournament.start_time || tournament.start_date || '').toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Description */}
        {tournament.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tournament.description}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Link to={`/tournaments?id=${tournament.id}`}>
            <Button variant="outline" className="w-full">
              <Trophy className="w-4 h-4 mr-2" />
              View Tournament
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}