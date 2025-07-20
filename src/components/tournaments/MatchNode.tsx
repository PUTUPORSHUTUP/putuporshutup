import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, CheckCircle } from 'lucide-react';

interface MatchNodeData {
  round: number;
  matchNumber: number;
  player1?: {
    id: string;
    name: string;
    avatar?: string;
  };
  player2?: {
    id: string;
    name: string;
    avatar?: string;
  };
  winner?: string;
  status: 'pending' | 'in_progress' | 'completed';
  isChampionship?: boolean;
}

interface MatchNodeProps {
  data: MatchNodeData;
}

const MatchNode = memo(({ data }: MatchNodeProps) => {
  const { round, player1, player2, winner, status, isChampionship } = data;

  const getPlayerDisplay = (player?: { id: string; name: string; avatar?: string }) => {
    if (!player) return 'TBD';
    return player.name;
  };

  const isPlayerWinner = (playerId?: string) => {
    return winner && playerId === winner;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`tournament-match ${isChampionship ? 'championship' : ''}`}>
      {/* Input handles */}
      {round > 1 && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="player1"
            style={{ top: '25%' }}
            className="tournament-handle"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="player2"
            style={{ top: '75%' }}
            className="tournament-handle"
          />
        </>
      )}

      {/* Match content */}
      <div className="match-header">
        <div className="flex items-center gap-2">
          {isChampionship && <Trophy className="w-4 h-4 text-yellow-600" />}
          <span className="text-xs font-medium">
            {isChampionship ? 'CHAMPIONSHIP' : `Round ${round}`}
          </span>
          {getStatusIcon()}
        </div>
        <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="text-xs">
          {status}
        </Badge>
      </div>

      <div className="match-players">
        {/* Player 1 */}
        <div className={`player-slot ${isPlayerWinner(player1?.id) ? 'winner' : ''}`}>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {player1 ? player1.name.substring(0, 2).toUpperCase() : 'T'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {getPlayerDisplay(player1)}
            </span>
          </div>
          {isPlayerWinner(player1?.id) && (
            <Trophy className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          )}
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <span className="text-xs text-muted-foreground">VS</span>
        </div>

        {/* Player 2 */}
        <div className={`player-slot ${isPlayerWinner(player2?.id) ? 'winner' : ''}`}>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {player2 ? player2.name.substring(0, 2).toUpperCase() : 'T'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {getPlayerDisplay(player2)}
            </span>
          </div>
          {isPlayerWinner(player2?.id) && (
            <Trophy className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Output handle */}
      {!isChampionship && (
        <Handle
          type="source"
          position={Position.Right}
          id="winner"
          className="tournament-handle"
        />
      )}
    </div>
  );
});

MatchNode.displayName = 'MatchNode';

export default MatchNode;