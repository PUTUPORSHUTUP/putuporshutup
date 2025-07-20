import { useMemo } from 'react';
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

interface TournamentBracketProps {
  matches: any[];
  participants: any[];
  tournamentSize: number;
  tournament: any;
}

const nodeTypes = {
  match: MatchNode,
};

export const TournamentBracket = ({ matches, participants, tournamentSize, tournament }: TournamentBracketProps) => {
  const { user } = useAuth();
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
      const xPosition = (round - 1) * 300 + 150;

      // Find players for this match
      const player1 = participants.find(p => p.user_id === match.player1_id);
      const player2 = participants.find(p => p.user_id === match.player2_id);

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
          isOrganizer: user?.id === tournament.creator_id
        },
      });

      // Create edges to next round
      if (round < totalRounds) {
        const nextRoundMatch = matches.find(m => 
          m.round_number === round + 1 && 
          Math.floor((match.match_number - 1) / 2) + 1 === m.match_number
        );

        if (nextRoundMatch) {
          const isUpperBracket = (match.match_number - 1) % 2 === 0;
          edges.push({
            id: `edge-${match.id}-${nextRoundMatch.id}`,
            source: `match-${match.id}`,
            target: `match-${nextRoundMatch.id}`,
            sourceHandle: 'winner',
            targetHandle: isUpperBracket ? 'player1' : 'player2',
            style: { stroke: '#9E86ED', strokeWidth: 2 },
            animated: match.status === 'completed',
          });
        }
      }
    });

    return { nodes, edges };
  }, [matches, participants, tournamentSize]);

  return (
    <div className="tournament-bracket-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        className="tournament-flow"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor="#9E86ED"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};