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
  MessageSquare,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Shield,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Dispute {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  user_id: string;
  wager_id?: string;
  tournament_match_id?: string;
  evidence_urls?: string[];
  admin_response?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    username: string;
  };
  wagers?: {
    title: string;
    stake_amount: number;
    game: {
      display_name: string;
    };
  };
  tournament_matches?: {
    round_number: number;
    match_number: number;
    tournaments: {
      title: string;
    };
  };
}

interface DisputeStats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  averageResolutionTime: number;
}

export const DisputeManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [stats, setStats] = useState<DisputeStats>({
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    averageResolutionTime: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDisputes();
    loadStats();
    
    // Set up real-time subscription for dispute updates
    const channel = supabase
      .channel('admin-disputes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disputes'
        },
        (payload) => {
          console.log('Dispute update:', payload);
          loadDisputes();
          loadStats();
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Dispute Filed",
              description: "A new dispute has been submitted for review.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const loadDisputes = async () => {
    try {
      // First get disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;

      if (disputesData && disputesData.length > 0) {
        // Get user profiles
        const userIds = disputesData.map(d => d.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', userIds);

        // Get wager data for disputes with wager_id
        const wagerIds = disputesData.filter(d => d.wager_id).map(d => d.wager_id);
        let wagersData: any[] = [];
        if (wagerIds.length > 0) {
          const { data } = await supabase
            .from('wagers')
            .select(`
              id,
              title,
              stake_amount,
              game:game_id (
                display_name
              )
            `)
            .in('id', wagerIds);
          wagersData = data || [];
        }

        // Combine data
        const disputesWithData = disputesData.map(dispute => ({
          ...dispute,
          profiles: profilesData?.find(p => p.user_id === dispute.user_id),
          wagers: dispute.wager_id ? wagersData.find(w => w.id === dispute.wager_id) : undefined
        }));

        setDisputes(disputesWithData as any);
      } else {
        setDisputes([]);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('status, created_at, resolved_at');

      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter(d => d.status === 'pending').length || 0;
      const investigating = data?.filter(d => d.status === 'investigating').length || 0;
      const resolved = data?.filter(d => d.status === 'resolved').length || 0;

      // Calculate average resolution time
      const resolvedDisputes = data?.filter(d => d.status === 'resolved' && d.resolved_at);
      const averageResolutionTime = resolvedDisputes?.length > 0
        ? resolvedDisputes.reduce((acc, dispute) => {
            const resolutionTime = new Date(dispute.resolved_at!).getTime() - new Date(dispute.created_at).getTime();
            return acc + resolutionTime;
          }, 0) / resolvedDisputes.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      setStats({
        total,
        pending,
        investigating,
        resolved,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    setResolveLoading(true);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'resolved') {
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
        updateData.admin_response = adminResponse;
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      await loadDisputes();
      await loadStats();
      
      setSelectedDispute(null);
      setAdminResponse('');

      toast({
        title: "Dispute Updated",
        description: `Dispute status changed to ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute",
        variant: "destructive"
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'investigating':
        return <Eye className="h-4 w-4 text-info" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'destructive' as const,
      investigating: 'secondary' as const,
      resolved: 'default' as const
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'match_result':
        return 'border-l-red-500';
      case 'payment':
        return 'border-l-orange-500';
      case 'harassment':
        return 'border-l-purple-500';
      case 'cheating':
        return 'border-l-red-600';
      default:
        return 'border-l-blue-500';
    }
  };

  const filteredDisputes = disputes
    .filter(dispute => filter === 'all' || dispute.status === filter)
    .filter(dispute => 
      searchTerm === '' || 
      dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <p className="text-sm text-muted-foreground">Total Disputes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-destructive">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold text-info">{stats.investigating}</p>
              </div>
              <Eye className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">{stats.averageResolutionTime}h</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
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
                  placeholder="Search disputes..."
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
                <SelectItem value="all">All Disputes</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dispute Queue ({filteredDisputes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No disputes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className={`p-4 rounded-lg border-l-4 bg-card ${getPriorityColor(dispute.type)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dispute.status)}
                        <h3 className="font-medium">{dispute.title}</h3>
                        {getStatusBadge(dispute.status)}
                        <Badge variant="outline" className="text-xs">
                          {dispute.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dispute.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {dispute.profiles?.display_name || dispute.profiles?.username || 'Unknown User'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                        </div>
                        {dispute.wagers && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            ${dispute.wagers.stake_amount} {dispute.wagers.game?.display_name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDispute(dispute)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <Card className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Dispute Review
                    </CardTitle>
                    <Button variant="ghost" onClick={() => setSelectedDispute(null)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedDispute.status)}
                      </div>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {selectedDispute.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Title</Label>
                    <p className="mt-1 text-sm">{selectedDispute.title}</p>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedDispute.description}
                    </p>
                  </div>

                  <div>
                    <Label>Submitted By</Label>
                    <p className="mt-1 text-sm">
                      {selectedDispute.profiles?.display_name || selectedDispute.profiles?.username || 'Unknown User'}
                    </p>
                  </div>

                  {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                    <div>
                      <Label>Evidence</Label>
                      <div className="mt-1 space-y-2">
                        {selectedDispute.evidence_urls.map((url, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Evidence {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDispute.status !== 'resolved' && (
                    <div>
                      <Label htmlFor="admin-response">Admin Response</Label>
                      <Textarea
                        id="admin-response"
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Provide your resolution and any actions taken..."
                        className="mt-1"
                      />
                    </div>
                  )}

                  {selectedDispute.admin_response && (
                    <div>
                      <Label>Previous Admin Response</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedDispute.admin_response}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {selectedDispute.status === 'pending' && (
                      <Button
                        onClick={() => updateDisputeStatus(selectedDispute.id, 'investigating')}
                        disabled={resolveLoading}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Start Investigation
                      </Button>
                    )}
                    
                    {selectedDispute.status !== 'resolved' && (
                      <Button
                        onClick={() => updateDisputeStatus(selectedDispute.id, 'resolved')}
                        disabled={resolveLoading || !adminResponse.trim()}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {resolveLoading ? 'Resolving...' : 'Resolve Dispute'}
                      </Button>
                    )}
                    
                    <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};