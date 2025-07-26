import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useModerator } from '@/hooks/useModerator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FlaggedMatchCard } from '@/components/moderator/FlaggedMatchCard';
import { 
  Shield, 
  Flag, 
  Activity, 
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface ModeratorStats {
  total_flagged: number;
  pending_review: number;
  under_review: number;
  resolved_today: number;
}

const Moderator = () => {
  const { user } = useAuth();
  const { isModerator, userRole, loading: roleLoading } = useModerator();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [flaggedMatches, setFlaggedMatches] = useState<FlaggedMatch[]>([]);
  const [stats, setStats] = useState<ModeratorStats>({
    total_flagged: 0,
    pending_review: 0,
    under_review: 0,
    resolved_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (!roleLoading && !isModerator) {
      toast({
        title: "Access Denied",
        description: "You don't have moderator permissions.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (isModerator) {
      loadFlaggedMatches();
      loadStats();
    }
  }, [isModerator, roleLoading, navigate, toast]);

  const loadFlaggedMatches = async () => {
    try {
      // Get flagged matches first
      const { data: matchesData, error: matchesError } = await supabase
        .from('flagged_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      const flaggedMatches = matchesData || [];
      if (flaggedMatches.length === 0) {
        setFlaggedMatches([]);
        return;
      }

      // Get wager data for matches that have wager_id
      const wagerIds = flaggedMatches
        .filter(m => m.wager_id)
        .map(m => m.wager_id)
        .filter(Boolean);

      let wagersData: any[] = [];
      if (wagerIds.length > 0) {
        const { data } = await supabase
          .from('wagers')
          .select('id, title, stake_amount, games (display_name)')
          .in('id', wagerIds);
        wagersData = data || [];
      }

      // Get tournament data for matches that have tournament_match_id
      const tournamentMatchIds = flaggedMatches
        .filter(m => m.tournament_match_id)
        .map(m => m.tournament_match_id)
        .filter(Boolean);

      let tournamentData: any[] = [];
      if (tournamentMatchIds.length > 0) {
        const { data } = await supabase
          .from('tournament_matches')
          .select('id, tournaments (title)')
          .in('id', tournamentMatchIds);
        tournamentData = data || [];
      }

      // Get user profiles
      const userIds = flaggedMatches.map(m => m.flagged_by);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .in('user_id', userIds);

      // Combine all data
      const matchesWithData: FlaggedMatch[] = flaggedMatches.map(match => ({
        ...match,
        profiles: profilesData?.find(p => p.user_id === match.flagged_by),
        wagers: match.wager_id ? wagersData.find(w => w.id === match.wager_id) : undefined,
        tournament_matches: match.tournament_match_id ? 
          tournamentData.find(t => t.id === match.tournament_match_id) : undefined
      }));

      setFlaggedMatches(matchesWithData);
    } catch (error) {
      console.error('Error loading flagged matches:', error);
      toast({
        title: "Error",
        description: "Failed to load flagged matches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('flagged_matches')
        .select('status, created_at');

      if (error) throw error;

      const today = new Date().toDateString();
      const stats = {
        total_flagged: data?.length || 0,
        pending_review: data?.filter(m => m.status === 'pending').length || 0,
        under_review: data?.filter(m => m.status === 'under_review').length || 0,
        resolved_today: data?.filter(m => 
          m.status === 'resolved' && 
          new Date(m.created_at).toDateString() === today
        ).length || 0
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredMatches = flaggedMatches.filter(match => {
    const matchesSearch = searchTerm === '' || 
      match.flag_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.wagers?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.tournament_matches?.tournament?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || match.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (roleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isModerator) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Moderator Dashboard</h1>
              <p className="text-muted-foreground">
                Role: {userRole.toUpperCase()} | Review flagged matches and disputes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_flagged}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pending_review}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.under_review}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.resolved_today}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search matches, reasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Flagged Matches */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Flagged Matches ({filteredMatches.length})</h2>
          
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No flagged matches found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMatches.map((match) => (
                <FlaggedMatchCard 
                  key={match.id} 
                  match={match} 
                  onUpdate={() => {
                    loadFlaggedMatches();
                    loadStats();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Moderator;