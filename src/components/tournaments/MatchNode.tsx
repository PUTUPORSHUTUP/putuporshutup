import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle, AlertTriangle, Flag, Zap, Crown } from 'lucide-react';
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
  isUpdating?: boolean;
  tournamentId?: string;
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
    isOrganizer,
    isUpdating,
    tournamentId
  } = data;
  
  const [isReporting, setIsReporting] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const { toast } = useToast();

  // Handle real-time update animations
  useEffect(() => {
    if (isUpdating) {
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isUpdating]);

  const getPlayerDisplay = (player?: { id: string; name: string; avatar?: string }) => {
    if (!player) return 'TBD';
    return player.name;
  };

  const isPlayerWinner = (playerId?: string) => {
    return winner && playerId === winner;
  };

  const getStatusIcon = () => {
    if (resultDisputed) {
      return <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'in_progress':
        return <Zap className="w-4 h-4 text-warning animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      default:
        return 'outline';
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
        description: "Match result has been reported successfully.",
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
      return <Badge variant="destructive" className="text-xs animate-pulse">Disputed</Badge>;
    }
    if (player1ReportedWinner && player2ReportedWinner) {
      if (player1ReportedWinner === player2ReportedWinner) {
        return <Badge variant="default" className="text-xs">Agreed</Badge>;
      } else {
        return <Badge variant="destructive" className="text-xs">Conflict</Badge>;
      }
    }
    if (player1ReportedWinner || player2ReportedWinner) {
      return <Badge variant="secondary" className="text-xs">Reported</Badge>;
    }
    return null;
  };

  const matchClassName = `tournament-match ${isChampionship ? 'championship' : ''} ${justUpdated ? 'updating' : ''}`;

  return (
    <div className={matchClassName}>
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
          {isChampionship && <Crown className="w-4 h-4 text-warning animate-pulse" />}
          <span className="text-xs font-medium">
            {isChampionship ? 'CHAMPIONSHIP' : `Round ${round}`}
          </span>
          {getStatusIcon()}
        </div>
        <div className="flex gap-1">
          <Badge variant={getStatusBadgeVariant()} className="text-xs capitalize">
            {status.replace('_', ' ')}
          </Badge>
          {getReportingStatus()}
        </div>
      </div>

      <div className="match-players">
        {/* Player 1 */}
        <div className={`player-slot ${isPlayerWinner(player1?.id) ? 'winner' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-6 h-6 flex-shrink-0">
              {player1?.avatar && (
                <AvatarImage src={player1.avatar} alt={player1.name} />
              )}
              <AvatarFallback className="text-xs">
                {player1 ? player1.name.substring(0, 2).toUpperCase() : 'T'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {getPlayerDisplay(player1)}
            </span>
          </div>
          {isPlayerWinner(player1?.id) && (
            <Trophy className="w-4 h-4 text-warning flex-shrink-0 animate-bounce" />
          )}
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <span className="text-xs text-muted-foreground font-bold">VS</span>
        </div>

        {/* Player 2 */}
        <div className={`player-slot ${isPlayerWinner(player2?.id) ? 'winner' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-6 h-6 flex-shrink-0">
              {player2?.avatar && (
                <AvatarImage src={player2.avatar} alt={player2.name} />
              )}
              <AvatarFallback className="text-xs">
                {player2 ? player2.name.substring(0, 2).toUpperCase() : 'T'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {getPlayerDisplay(player2)}
            </span>
          </div>
          {isPlayerWinner(player2?.id) && (
            <Trophy className="w-4 h-4 text-warning flex-shrink-0 animate-bounce" />
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
              className="text-xs transition-all duration-200"
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
              className="text-xs transition-all duration-200"
            >
              <Flag className="w-3 h-3 mr-1" />
              {player2.name} Wins
            </Button>
          )}
        </div>
      )}

      {/* Winner advancement indicator */}
      {status === 'completed' && winner && !isChampionship && (
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"></div>
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