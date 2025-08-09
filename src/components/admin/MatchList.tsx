import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  GamepadIcon,
  Search,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatedCard, AnimatedListItem } from '@/components/ui/animated-components';
import { useStaggeredAnimation } from '@/hooks/useAnimations';

interface Match {
  id: string;
  title: string;
  stake_amount: number;
  status: string;
  creator_id: string;
  winner_id?: string;
  platform: string;
  game_mode?: string;
  total_pot: number;
  max_participants: number;
  created_at: string;
  end_time?: string;
  game?: { display_name: string };
  creator?: { display_name: string };
  winner?: { display_name: string };
  participants?: Array<{
    user?: { display_name: string };
  }>;
}

interface MatchListProps {
  matches: Match[];
  onViewMatch: (match: Match) => void;
  onEditMatch?: (match: Match) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const MatchList = ({
  matches,
  onViewMatch,
  onEditMatch,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: MatchListProps) => {
  const { triggerStagger, isActive } = useStaggeredAnimation(matches.length, 50);

  React.useEffect(() => {
    triggerStagger();
  }, [matches, triggerStagger]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disputed':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnimatedCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Matches</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title, creator, or game..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status Filter</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AnimatedCard>

      {/* Match List */}
      <div className="grid gap-4">
        {matches.map((match, index) => (
          <AnimatedListItem
            key={match.id}
            index={index}
            className={`transition-opacity duration-300 ${
              isActive(index) ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Card className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {match.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GamepadIcon className="w-4 h-4" />
                      <span>{match.game?.display_name}</span>
                      <span>•</span>
                      <span>{match.platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.status)}
                    <Badge className={getStatusColor(match.status)}>
                      {match.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                      <DollarSign className="w-5 h-5" />
                      {match.stake_amount}
                    </div>
                    <div className="text-xs text-muted-foreground">Stake</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-money-green">
                      ${match.total_pot}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Pot</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {match.participants?.length || 0}/{match.max_participants}
                    </div>
                    <div className="text-xs text-muted-foreground">Players</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-muted-foreground">Created</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Creator: </span>
                    <span className="font-medium">{match.creator?.display_name}</span>
                    {match.winner && (
                      <>
                        <span className="text-muted-foreground ml-4">Winner: </span>
                        <span className="font-medium text-money-green">{match.winner.display_name}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewMatch(match)}
                      className="hover:scale-105 transition-transform"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {onEditMatch && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditMatch(match)}
                        className="hover:scale-105 transition-transform"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>
        ))}
      </div>

      {matches.length === 0 && (
        <AnimatedCard className="text-center p-8">
          <div className="text-muted-foreground">
            No matches found matching your criteria.
          </div>
        </AnimatedCard>
      )}
    </div>
  );
};