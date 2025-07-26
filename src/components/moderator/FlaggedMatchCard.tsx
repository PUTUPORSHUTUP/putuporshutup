import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { modRecommendation, submitModeratorAction } from '@/lib/moderatorApi';
import { 
  Flag, 
  Eye, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';

interface FlaggedMatch {
  id: string;
  wager_id?: string;
  tournament_match_id?: string;
  flag_reason: string;
  priority: string;
  status: string;
  mod_notes?: string;
  mod_recommendation?: string;
  created_at: string;
  flagged_by: string;
  reviewed_at?: string;
  reviewed_by?: string;
  profiles?: {
    display_name?: string;
    username?: string;
  };
  wagers?: {
    title: string;
    stake_amount: number;
    result_proof_url?: string;
    creator_id: string;
    game?: {
      display_name: string;
    };
    wager_participants?: Array<{
      user_id: string;
      profiles?: {
        display_name?: string;
        username?: string;
      };
    }>;
  };
  tournament_matches?: {
    player1_id?: string;
    player2_id?: string;
    result_proof_url?: string;
    tournament?: {
      title: string;
    };
  };
}

interface FlaggedMatchCardProps {
  match: FlaggedMatch;
  onUpdate: () => void;
}

export const FlaggedMatchCard = ({ match, onUpdate }: FlaggedMatchCardProps) => {
  const { toast } = useToast();
  const [modNotes, setModNotes] = useState(match.mod_notes || '');
  const [recommendation, setRecommendation] = useState(match.mod_recommendation || '');
  const [status, setStatus] = useState(match.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'dismissed': return <XCircle className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Use the new moderator API
      await modRecommendation({
        matchId: match.id,
        recommendation: recommendation,
        notes: modNotes
      });

      toast({
        title: "Match Updated",
        description: "Moderator notes and recommendation have been saved.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating flagged match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update match. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFlagUser = async () => {
    try {
      await submitModeratorAction(match.id, 'flag_user', 'User flagged for suspicious activity');
      
      toast({
        title: "User Flagged",
        description: "User has been flagged for review.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error flagging user:', error);
      toast({
        title: "Error",
        description: "Failed to flag user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const matchTitle = match.wagers?.title || match.tournament_matches?.tournament?.title || 'Unknown Match';
  const gameTitle = match.wagers?.game?.display_name || 'Unknown Game';
  const flaggedByName = match.profiles?.display_name || match.profiles?.username || 'Unknown User';
  const stakeAmount = match.wagers?.stake_amount;
  const proofLink = match.wagers?.result_proof_url || match.tournament_matches?.result_proof_url;
  
  // Get player information
  const getPlayerNames = () => {
    if (match.wagers?.wager_participants) {
      return match.wagers.wager_participants
        .map(p => p.profiles?.display_name || p.profiles?.username || 'Unknown Player')
        .join(' vs ');
    }
    return 'Players information not available';
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{matchTitle}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getPriorityColor(match.priority)} text-white border-none`}
            >
              {match.priority.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              {getStatusIcon(status)}
              {status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        
        {/* Match Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-4">
          <div className="space-y-2">
            <p><span className="font-medium">Match ID:</span> {match.id.slice(0, 8)}...</p>
            <p><span className="font-medium">Game:</span> {gameTitle}</p>
            <p><span className="font-medium">Players:</span> {getPlayerNames()}</p>
            {stakeAmount && <p><span className="font-medium">Stake:</span> ${stakeAmount}</p>}
          </div>
          <div className="space-y-2">
            <p><span className="font-medium">Flagged by:</span> {flaggedByName}</p>
            <p><span className="font-medium">Timestamp:</span> {new Date(match.created_at).toLocaleString()}</p>
            {match.reviewed_at && (
              <p><span className="font-medium">Reviewed:</span> {new Date(match.reviewed_at).toLocaleString()}</p>
            )}
            {proofLink && (
              <p>
                <span className="font-medium">Proof:</span>{' '}
                <a 
                  href={proofLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Proof
                </a>
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Flag className="h-4 w-4" />
            Flag Reason
          </h4>
          <p className="text-sm bg-muted p-3 rounded">{match.flag_reason}</p>
        </div>

        {/* Existing Notes Display */}
        {match.mod_notes && (
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Existing Notes
            </h4>
            <p className="text-sm bg-muted/50 p-3 rounded border">{match.mod_notes}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-background border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Add Moderator Notes
          </label>
          <Textarea
            value={modNotes}
            onChange={(e) => setModNotes(e.target.value)}
            placeholder="Add your notes about this case..."
            className="min-h-[80px] bg-background border"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Moderator Recommendation
          </label>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger className="bg-background border">
              <SelectValue placeholder="Select your recommendation..." />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="payout_winner">Payout to Winner</SelectItem>
              <SelectItem value="refund_all">Refund All Players</SelectItem>
              <SelectItem value="escalate_admin">Escalate to Admin</SelectItem>
              <SelectItem value="need_more_proof">Need More Proof</SelectItem>
              <SelectItem value="dismiss_invalid">Dismiss - Invalid Claim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleUpdate}
            disabled={isUpdating || !recommendation}
            className="flex-1"
            size="lg"
          >
            {isUpdating ? 'Submitting...' : 'Submit Recommendation'}
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleFlagUser}
          >
            <User className="h-4 w-4" />
            Flag User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};