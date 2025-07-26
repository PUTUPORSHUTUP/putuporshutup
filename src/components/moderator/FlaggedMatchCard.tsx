import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  profiles?: {
    display_name?: string;
    username?: string;
  };
  wagers?: {
    title: string;
    stake_amount: number;
    game?: {
      display_name: string;
    };
  };
  tournament_matches?: {
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
      const { error } = await supabase
        .from('flagged_matches')
        .update({
          mod_notes: modNotes,
          mod_recommendation: recommendation,
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', match.id);

      if (error) throw error;

      toast({
        title: "Match Updated",
        description: "Moderator notes and recommendation have been saved.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating flagged match:', error);
      toast({
        title: "Error",
        description: "Failed to update match. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const matchTitle = match.wagers?.title || match.tournament_matches?.tournament?.title || 'Unknown Match';
  const gameTitle = match.wagers?.game?.display_name || 'Unknown Game';
  const flaggedByName = match.profiles?.display_name || match.profiles?.username || 'Unknown User';

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
        <div className="text-sm text-muted-foreground">
          <p>Game: {gameTitle}</p>
          <p>Flagged by: {flaggedByName}</p>
          <p>Date: {new Date(match.created_at).toLocaleDateString()}</p>
          {match.wagers?.stake_amount && (
            <p>Stake: ${match.wagers.stake_amount}</p>
          )}
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

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            Moderator Notes
          </label>
          <Textarea
            value={modNotes}
            onChange={(e) => setModNotes(e.target.value)}
            placeholder="Add internal notes about this case..."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recommendation
          </label>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger>
              <SelectValue placeholder="Select recommendation..." />
            </SelectTrigger>
            <SelectContent>
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
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? 'Updating...' : 'Update Case'}
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Flag User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};