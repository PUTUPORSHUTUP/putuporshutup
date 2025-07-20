import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle, AlertTriangle, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  matchId: string;
  player1ReportedWinner?: string;
  player2ReportedWinner?: string;
  resultDisputed?: boolean;
  confirmedByOrganizer?: boolean;
  currentUserId?: string;
  isOrganizer?: boolean;
}

interface MatchNodeProps {
  data: MatchNodeData;
}

const MatchNode = memo(({ data }: MatchNodeProps) => {
  const { 
    round, 
    player1, 
    player2, 
    winner, 
    status, 
    isChampionship, 
    matchId,
    player1ReportedWinner,
    player2ReportedWinner,
    resultDisputed,
    confirmedByOrganizer,
    currentUserId,
    isOrganizer
  } = data;
  
  const [isReporting, setIsReporting] = useState(false);
  const { toast } = useToast();

  const getPlayerDisplay = (player?: { id: string; name: string; avatar?: string }) => {
    if (!player) return 'TBD';
    return player.name;
  };

  const isPlayerWinner = (playerId?: string) => {
    return winner && playerId === winner;
  };

  const getStatusIcon = () => {
    if (resultDisputed) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const canReportResult = () => {
    if (status === 'completed' || !currentUserId) return false;
    if (!player1 || !player2) return false;
    
    const isParticipant = currentUserId === player1.id || currentUserId === player2.id;
    return isParticipant || isOrganizer;
  };

  const reportResult = async (winnerId: string) => {
    if (!matchId || isReporting) return;
    
    setIsReporting(true);
    try {
      const { error } = await supabase.functions.invoke('report-match-result', {
        body: { matchId, winnerId }
      });

      if (error) throw error;

      toast({
        title: "Result Reported",
        description: "Match result has been reported successfully."
      });
    } catch (error: any) {
      console.error('Error reporting result:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to report result",
        variant: "destructive"
      });
    } finally {
      setIsReporting(false);
    }
  };

  const getReportingStatus = () => {
    if (resultDisputed) {
      return <Badge variant="destructive" className="text-xs">Disputed</Badge>;
    }
    if (player1ReportedWinner && player2ReportedWinner) {
      return <Badge variant="default" className="text-xs">Both Reported</Badge>;
    }
    if (player1ReportedWinner || player2ReportedWinner) {
      return <Badge variant="secondary" className="text-xs">1 Reported</Badge>;
    }
    return null;
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
        <div className="flex gap-1">
          <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="text-xs">
            {status}
          </Badge>
          {getReportingStatus()}
        </div>
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

      {/* Result Reporting Buttons */}
      {canReportResult() && status !== 'completed' && (
        <div className="match-actions">
          {player1 && (
            <Button
              size="sm"
              variant={player1ReportedWinner === player1.id || currentUserId === player1.id ? "default" : "outline"}
              onClick={() => reportResult(player1.id)}
              disabled={isReporting}
              className="text-xs"
            >
              <Flag className="w-3 h-3 mr-1" />
              {player1.name} Wins
            </Button>
          )}
          {player2 && (
            <Button
              size="sm"
              variant={player2ReportedWinner === player2.id || currentUserId === player2.id ? "default" : "outline"}
              onClick={() => reportResult(player2.id)}
              disabled={isReporting}
              className="text-xs"
            >
              <Flag className="w-3 h-3 mr-1" />
              {player2.name} Wins
            </Button>
          )}
        </div>
      )}

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