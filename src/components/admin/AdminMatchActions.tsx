import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit3,
  Ban,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-components';
import { useToast } from '@/hooks/use-toast';

interface Match {
  id: string;
  title: string;
  status: string;
  creator_id: string;
  winner_id?: string;
  stake_amount: number;
  total_pot: number;
  created_at: string;
}

interface AdminMatchActionsProps {
  match: Match;
  onMatchUpdate: (matchId: string, updates: any) => void;
  onClose: () => void;
}

export const AdminMatchActions = ({ 
  match, 
  onMatchUpdate, 
  onClose 
}: AdminMatchActionsProps) => {
  const [actionType, setActionType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState(match.status);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async () => {
    if (!reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the status change.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await onMatchUpdate(match.id, {
        status: newStatus,
        admin_notes: notes,
        override_reason: reason,
        admin_override: true,
        admin_actioned_by: 'current_admin_id', // Replace with actual admin ID
        last_admin_action_at: new Date().toISOString()
      });

      toast({
        title: "Match Updated",
        description: `Match status changed to ${newStatus}`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please provide a reason for the refund.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await onMatchUpdate(match.id, {
        status: 'refunded',
        admin_notes: `Refund issued: ${reason}. ${notes}`,
        override_reason: reason,
        admin_override: true
      });

      toast({
        title: "Refund Processed",
        description: "Participants will be refunded their stake amounts.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disputed':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const actionButtons = [
    {
      type: 'status_change',
      label: 'Change Status',
      icon: <Edit3 className="w-4 h-4" />,
      color: 'primary'
    },
    {
      type: 'refund',
      label: 'Issue Refund',
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'destructive'
    },
    {
      type: 'dispute',
      label: 'Mark Disputed',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'secondary'
    },
    {
      type: 'ban_user',
      label: 'Ban Creator',
      icon: <Ban className="w-4 h-4" />,
      color: 'destructive'
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Admin Actions - {match.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Status</span>
              <Badge className={getStatusColor(match.status)}>
                {getStatusIcon(match.status)}
                {match.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Stake Amount:</span>
                <span className="ml-2 font-medium">${match.stake_amount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Pot:</span>
                <span className="ml-2 font-medium">${match.total_pot}</span>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          {!actionType && (
            <div className="space-y-3">
              <Label>Select Action</Label>
              <div className="grid grid-cols-2 gap-3">
                {actionButtons.map((action) => (
                  <AnimatedButton
                    key={action.type}
                    variant="outline"
                    onClick={() => setActionType(action.type)}
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105"
                  >
                    {action.icon}
                    <span className="text-sm">{action.label}</span>
                  </AnimatedButton>
                ))}
              </div>
            </div>
          )}

          {/* Status Change Form */}
          {actionType === 'status_change' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <Label htmlFor="newStatus">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Common Fields */}
          {actionType && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Required)</Label>
                <Textarea
                  id="reason"
                  placeholder="Provide a clear reason for this action..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional context or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {actionType && (
            <Button variant="outline" onClick={() => setActionType('')}>
              Back
            </Button>
          )}

          {actionType === 'status_change' && (
            <AnimatedButton 
              onClick={handleStatusChange} 
              disabled={loading || !reason.trim()}
              animationType="glow"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Update Status
            </AnimatedButton>
          )}

          {actionType === 'refund' && (
            <AnimatedButton 
              variant="destructive" 
              onClick={handleRefund}
              disabled={loading || !reason.trim()}
              animationType="glow"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Process Refund
            </AnimatedButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};