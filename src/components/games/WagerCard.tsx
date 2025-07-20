import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, Users, Clock, DollarSign, Gamepad2, Loader2, LogOut } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
  image_url?: string;
  is_active: boolean;
}

interface Wager {
  id: string;
  title: string;
  description: string | null;
  stake_amount: number;
  max_participants: number;
  platform: string;
  game_mode: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  total_pot: number;
  created_at: string;
  creator_id: string;
  game: Game;
  participant_count: number;
  user_participated?: boolean; // Added to track if user is in this wager
}

interface WagerCardProps {
  wager: Wager;
  onJoin: (wagerId: string, stakeAmount: number) => void;
  onLeave: (wagerId: string) => void;
  currentUserId?: string;
  isJoining?: boolean;
  isLeaving?: boolean;
}

export const WagerCard = ({ wager, onJoin, onLeave, currentUserId, isJoining, isLeaving }: WagerCardProps) => {
  const isCreator = currentUserId === wager.creator_id;
  const isFull = wager.participant_count >= wager.max_participants;
  const isParticipant = wager.user_participated;
  const creatorName = 'Player'; // We'll fetch this later if needed

  const getStatusColor = () => {
    switch (wager.status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {wager.game.display_name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {wager.platform}
              </Badge>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            </div>
            <CardTitle className="text-lg leading-tight">{wager.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Creator Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {creatorName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{creatorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(wager.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Wager Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="font-bold text-green-600">${wager.stake_amount}</p>
              <p className="text-xs text-muted-foreground">Stake</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="font-bold text-yellow-600">${wager.total_pot}</p>
              <p className="text-xs text-muted-foreground">Total Pot</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold">
                {wager.participant_count}/{wager.max_participants}
              </p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-600" />
            <div>
              <p className="font-bold">{wager.game_mode || '1v1'}</p>
              <p className="text-xs text-muted-foreground">Mode</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {wager.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {wager.description}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {isParticipant ? (
            <Button 
              onClick={() => onLeave(wager.id)}
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLeaving}
              variant="destructive"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  {isCreator ? `Cancel Wager (${wager.stake_amount} refund)` : `Leave Wager (${wager.stake_amount} refund)`}
                </>
              )}
            </Button>
          ) : isFull ? (
            <Button disabled className="w-full" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Wager Full
            </Button>
          ) : (
            <Button 
              onClick={() => onJoin(wager.id, wager.stake_amount)}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Join for ${wager.stake_amount}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};