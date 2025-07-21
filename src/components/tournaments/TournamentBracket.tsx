import { useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import MatchNode from './MatchNode';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TournamentBracketProps {
  matches: any[];
  participants: any[];
  tournamentSize: number;
  tournament: any;
  onMatchUpdate?: () => void;
}

const nodeTypes = {
  match: MatchNode,
};

export const TournamentBracket = ({ 
  matches, 
  participants, 
  tournamentSize, 
  tournament, 
  onMatchUpdate 
}: TournamentBracketProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updatingMatches, setUpdatingMatches] = useState<Set<string>>(new Set());

  // Real-time subscriptions for tournament match updates
  useEffect(() => {
    if (!tournament?.id) return;

    const channel = supabase
      .channel(`tournament-${tournament.id}-matches`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournament.id}`
        },
        (payload) => {
          console.log('Tournament match update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const matchId = payload.new?.id;
            if (matchId) {
              // Flash the updated match
              setUpdatingMatches(prev => new Set(prev).add(matchId));
              setTimeout(() => {
                setUpdatingMatches(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(matchId);
                  return newSet;
                });
              }, 1000);

              // Show toast for match updates
              if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
                toast({
                  title: "Match Completed!",
                  description: `A match in ${tournament.title} has been completed.`,
                });
              }
            }
          }

          // Trigger parent component refresh
          onMatchUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament?.id, onMatchUpdate, toast]);

  const { nodes, edges } = useMemo(() => {
    // Calculate tournament rounds
    const totalRounds = Math.log2(tournamentSize);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Generate nodes for each match
    matches.forEach((match, index) => {
      const round = match.round_number;
      const matchesInRound = tournamentSize / Math.pow(2, round);
      const yPosition = (match.match_number - 1) * 200 + 100;
      const xPosition = (round - 1) * 320 + 150;

      // Find players for this match
      const player1 = participants.find(p => p.user_id === match.player1_id);
      const player2 = participants.find(p => p.user_id === match.player2_id);

      const isUpdating = updatingMatches.has(match.id);

      nodes.push({
        id: `match-${match.id}`,
        type: 'match',
        position: { x: xPosition, y: yPosition },
        data: {
          round: round,
          matchNumber: match.match_number,
          player1: player1 ? {
            id: player1.user_id,
            name: player1.profiles?.display_name || player1.profiles?.username || 'Player',
            avatar: player1.profiles?.avatar_url
          } : undefined,
          player2: player2 ? {
            id: player2.user_id,
            name: player2.profiles?.display_name || player2.profiles?.username || 'Player',
            avatar: player2.profiles?.avatar_url
          } : undefined,
          winner: match.winner_id,
          status: match.status,
          isChampionship: round === totalRounds,
          matchId: match.id,
          player1ReportedWinner: match.player1_reported_winner,
          player2ReportedWinner: match.player2_reported_winner,
          resultDisputed: match.result_disputed,
          confirmedByOrganizer: match.confirmed_by_organizer,
          currentUserId: user?.id,
          isOrganizer: user?.id === tournament.creator_id,
          isUpdating: isUpdating,
          tournamentId: tournament.id
        },
        className: isUpdating ? 'updating' : '',
      });

      // Create edges to next round with enhanced animations
      if (round < totalRounds) {
        const nextRoundMatch = matches.find(m => 
          m.round_number === round + 1 && 
          Math.floor((match.match_number - 1) / 2) + 1 === m.match_number
        );

        if (nextRoundMatch) {
          const isUpperBracket = (match.match_number - 1) % 2 === 0;
          const edgeStyle = {
            stroke: match.winner_id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            strokeWidth: match.winner_id ? 3 : 2,
            filter: match.winner_id ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' : 'none',
          };

          edges.push({
            id: `edge-${match.id}-${nextRoundMatch.id}`,
            source: `match-${match.id}`,
            target: `match-${nextRoundMatch.id}`,
            sourceHandle: 'winner',
            targetHandle: isUpperBracket ? 'player1' : 'player2',
            style: edgeStyle,
            animated: match.status === 'completed',
            className: match.winner_id ? 'winner-edge' : '',
          });
        }
      }
    });

    return { nodes, edges };
  }, [matches, participants, tournamentSize, user?.id, tournament, updatingMatches]);

  return (
    <div className="tournament-bracket-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        className="tournament-flow"
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          gap={40} 
          size={1} 
          color="hsl(var(--border))"
        />
        <Controls 
          position="top-left"
          showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.data?.isChampionship) return 'hsl(var(--primary))';
            if (node.data?.status === 'completed') return 'hsl(var(--success))';
            if (node.data?.status === 'in_progress') return 'hsl(var(--warning))';
            return 'hsl(var(--muted-foreground))';
          }}
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!bg-card border border-border rounded-lg"
          position="bottom-right"
          style={{
            backgroundColor: 'hsl(var(--card))',
          }}
        />
      </ReactFlow>
    </div>
  );
};