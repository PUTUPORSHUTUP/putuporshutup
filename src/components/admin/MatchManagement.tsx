import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  GamepadIcon,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Shield,
  Search,
  DollarSign,
  Loader2,
  Edit3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

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
  admin_override: boolean;
  override_reason?: string;
  dispute_status: string;
  admin_actioned_by?: string;
  last_admin_action_at?: string;
  result_proof_url?: string;
  admin_notes?: string;
  games?: {
    display_name: string;
  };
  creator_profile?: {
    display_name: string;
    username: string;
  };
  winner_profile?: {
    display_name: string;
    username: string;
  };
  participants?: Array<{
    user_id: string;
    stake_paid: number;
    status: string;
    profiles: {
      display_name: string;
      username: string;
    };
  }>;
}

interface MatchStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  disputed: number;
  refunded: number;
  totalValue: number;
}

export const MatchManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [resultProofUrl, setResultProofUrl] = useState('');
  const [stats, setStats] = useState<MatchStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    disputed: 0,
    refunded: 0,
    totalValue: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'disputed' | 'refunded'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMatches();
    loadStats();
    
    // Set up real-time subscription for match updates
    const channel = supabase
      .channel('admin-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges'
        },
        (payload) => {
          console.log('Match update:', payload);
          loadMatches();
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMatches = async () => {
    try {
      // Load challenges with related data
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select(`
          *,
          games!inner (
            display_name
          ),
          creator_profile:profiles!creator_id (
            display_name,
            username
          ),
          winner_profile:profiles!winner_id (
            display_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      if (challengesData && challengesData.length > 0) {
        // Get participants for each challenge
        const challengeIds = challengesData.map(w => w.id);
        const { data: participantsData } = await supabase
          .from('challenge_participants')
          .select(`
            user_id,
            challenge_id,
            stake_paid,
            status,
            profiles:user_id (
              display_name,
              username
            )
          `)
          .in('challenge_id', challengeIds);

        // Combine data
        const matchesWithParticipants = challengesData.map(challenge => ({
          ...challenge,
          participants: participantsData?.filter(p => p.challenge_id === challenge.id) || []
        }));

        setMatches(matchesWithParticipants as any);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('status, stake_amount, total_pot, dispute_status');

      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter(m => m.status === 'open').length || 0;
      const inProgress = data?.filter(m => m.status === 'active').length || 0;
      const completed = data?.filter(m => m.status === 'completed').length || 0;
      const disputed = data?.filter(m => m.dispute_status === 'open').length || 0;
      const refunded = data?.filter(m => m.status === 'refunded').length || 0;
      const totalValue = data?.reduce((sum, match) => sum + (match.total_pot || 0), 0) || 0;

      setStats({
        total,
        pending,
        inProgress,
        completed,
        disputed,
        refunded,
        totalValue
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAdminOverride = async (
    matchId: string, 
    action: 'resolve' | 'refund' | 'dispute' | 'manual_complete',
    winnerId?: string
  ) => {
    setOverrideLoading(true);
    try {
      const updateData: any = {
        admin_override: true,
        override_reason: overrideReason,
        admin_actioned_by: user?.id,
        last_admin_action_at: new Date().toISOString(),
        admin_notes: adminNotes,
        result_proof_url: resultProofUrl || null,
        updated_at: new Date().toISOString()
      };

      // Set status and dispute status based on action
      switch (action) {
        case 'resolve':
          updateData.status = 'completed';
          updateData.dispute_status = 'resolved';
          if (winnerId) updateData.winner_id = winnerId;
          break;
        case 'refund':
          updateData.status = 'refunded';
          updateData.dispute_status = 'resolved';
          break;
        case 'dispute':
          updateData.dispute_status = 'manual';
          break;
        case 'manual_complete':
          updateData.status = 'completed';
          if (winnerId) updateData.winner_id = winnerId;
          break;
      }

      const { error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;

      await loadMatches();
      await loadStats();
      
      setSelectedMatch(null);
      setOverrideReason('');
      setAdminNotes('');
      setResultProofUrl('');

      toast({
        title: "Match Updated",
        description: `Match ${action} applied successfully`,
      });
    } catch (error: any) {
      console.error('Error applying admin override:', error);
      toast({
        title: "Error",
        description: "Failed to apply admin override",
        variant: "destructive"
      });
    } finally {
      setOverrideLoading(false);
    }
  };

  const getStatusIcon = (status: string, disputeStatus: string) => {
    if (disputeStatus === 'open') {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'active':
        return <GamepadIcon className="h-4 w-4 text-info" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'refunded':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, disputeStatus: string) => {
    if (disputeStatus === 'open') {
      return <Badge variant="destructive">Disputed</Badge>;
    }
    
    const variants = {
      open: 'secondary' as const,
      active: 'default' as const,
      completed: 'default' as const,
      refunded: 'outline' as const
    };
    
    const labels = {
      open: 'Pending',
      active: 'In Progress',
      completed: 'Completed',
      refunded: 'Refunded'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityColor = (status: string, disputeStatus: string) => {
    if (disputeStatus === 'open') return 'border-l-red-500';
    
    switch (status) {
      case 'open':
        return 'border-l-yellow-500';
      case 'active':
        return 'border-l-blue-500';
      case 'completed':
        return 'border-l-green-500';
      case 'refunded':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const filteredMatches = matches
    .filter(match => {
      if (filter === 'all') return true;
      if (filter === 'disputed') return match.dispute_status === 'open';
      return match.status === filter;
    })
    .filter(match => 
      searchTerm === '' || 
      match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.creator_profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.creator_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.games?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <GamepadIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disputed</p>
                <p className="text-2xl font-bold text-destructive">{stats.disputed}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-info">{stats.inProgress}</p>
              </div>
              <GamepadIcon className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Match Management Dashboard ({filteredMatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="text-center py-8">
              <GamepadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No matches found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border-l-4 bg-card ${getPriorityColor(match.status, match.dispute_status)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(match.status, match.dispute_status)}
                        <h3 className="font-medium">{match.title}</h3>
                        {getStatusBadge(match.status, match.dispute_status)}
                        {match.admin_override && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            Admin Override
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Challenge ID: {match.id.slice(0, 8)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Creator: {match.creator_profile?.display_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <GamepadIcon className="h-3 w-3" />
                          Game: {match.games?.display_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Fee: ${match.stake_amount}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                        </div>
                        {match.participants && match.participants.length > 0 && (
                          <div>
                            Players: {match.participants.map(p => p.profiles?.display_name || 'Unknown').join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Match Management: {selectedMatch.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Match Info Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Match Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Challenge ID</Label>
                      <p className="text-sm text-muted-foreground">{selectedMatch.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedMatch.status, selectedMatch.dispute_status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Game</Label>
                      <p className="text-sm text-muted-foreground">{selectedMatch.games?.display_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Fee</Label>
                      <p className="text-sm text-muted-foreground">${selectedMatch.stake_amount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Players</Label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Creator: {selectedMatch.creator_profile?.display_name || 'Unknown'}
                      </p>
                      {selectedMatch.participants?.map((participant, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          Participant {index + 1}: {participant.profiles?.display_name || 'Unknown'} 
                          (${participant.stake_paid})
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Result Proof Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Result Proof
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="proof-url">Link to screenshots or video</Label>
                    <Input
                      id="proof-url"
                      value={resultProofUrl}
                      onChange={(e) => setResultProofUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    {selectedMatch.result_proof_url && (
                      <p className="text-sm text-muted-foreground">
                        Current: {selectedMatch.result_proof_url}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Admin Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="admin-notes">Notes (for internal use)</Label>
                    <Textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this match..."
                      rows={3}
                    />
                    {selectedMatch.admin_notes && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Existing Notes:</Label>
                        <p className="text-sm text-muted-foreground">{selectedMatch.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="override-reason">Override Reason (required)</Label>
                    <Textarea
                      id="override-reason"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why this admin action is necessary..."
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleAdminOverride(selectedMatch.id, 'resolve', selectedMatch.creator_id)}
                      disabled={!overrideReason || overrideLoading}
                      variant="default"
                    >
                      {overrideLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Resolve for Creator
                    </Button>
                    
                    {selectedMatch.participants?.map((participant, index) => (
                      <Button
                        key={participant.user_id}
                        onClick={() => handleAdminOverride(selectedMatch.id, 'resolve', participant.user_id)}
                        disabled={!overrideReason || overrideLoading}
                        variant="default"
                      >
                        Resolve for {participant.profiles?.display_name || `Player ${index + 1}`}
                      </Button>
                    ))}
                    
                    <Button
                      onClick={() => handleAdminOverride(selectedMatch.id, 'refund')}
                      disabled={!overrideReason || overrideLoading}
                      variant="secondary"
                    >
                      Refund All
                    </Button>
                    
                    <Button
                      onClick={() => handleAdminOverride(selectedMatch.id, 'dispute')}
                      disabled={!overrideReason || overrideLoading}
                      variant="outline"
                    >
                      Mark for Manual Review
                    </Button>
                  </div>

                  {selectedMatch.admin_override && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium">Previous Admin Action:</p>
                      <p className="text-sm text-muted-foreground">{selectedMatch.override_reason}</p>
                      {selectedMatch.last_admin_action_at && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(selectedMatch.last_admin_action_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};