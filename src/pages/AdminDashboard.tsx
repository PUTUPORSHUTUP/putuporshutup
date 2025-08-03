import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Users, 
  Trophy, 
  TrendingUp, 
  Crown, 
  Shield,
  AlertTriangle,
  Activity,
  BarChart3,
  UserCheck,
  Ban,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Trash2,
  UserX,
  Loader2,
  Lightbulb,
  Image,
  CreditCard
} from 'lucide-react';
import { GamePerformanceAnalytics } from '@/components/admin/GamePerformanceAnalytics';
import { AutomatedGameOptimization } from '@/components/admin/AutomatedGameOptimization';
import { GameManagement } from '@/components/admin/GameManagement';
import { ProjectExportModal } from '@/components/admin/ProjectExportModal';
import XboxIntegrationTest from '@/components/admin/XboxIntegrationTest';
import XboxLiveDashboard from '@/components/admin/XboxLiveDashboard';
import ComprehensiveSystemTest from '@/components/admin/ComprehensiveSystemTest';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { DisputeManagement } from '@/components/admin/DisputeManagement';
import { MatchManagement } from '@/components/admin/MatchManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import MockRevenueProjection from '@/components/admin/MockRevenueProjection';
import { AutomationDashboard } from '@/components/admin/AutomationDashboard';
import { ProfitMaximizer } from '@/components/admin/ProfitMaximizer';
import SponsorDashboard from './SponsorDashboard';
import { XboxAPIKeyManagement } from '@/components/admin/XboxAPIKeyManagement';
import { FastPaymentProcessor } from '@/components/admin/FastPaymentProcessor';
import { PassiveIncomeController } from '@/components/admin/PassiveIncomeController';
import SponsorAdminPanel from '@/components/admin/SponsorAdminPanel';

interface AdminAnalytics {
  total_deposits: number;
  total_withdrawals: number;
  active_premium_users: number;
  total_users: number;
  total_tournaments: number;
  total_challenges: number;
  transactions_today: number;
  tournaments_this_week: number;
  new_users_this_week: number;
}

interface User {
  user_id: string;
  username: string;
  display_name: string;
  wallet_balance: number;
  is_premium: boolean;
  is_admin: boolean;
  total_wins: number;
  total_losses: number;
  created_at: string;
}

interface Tournament {
  id: string;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  prize_pool: number;
  created_at: string;
}

interface Dispute {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  admin_response: string | null;
  profiles: {
    username: string;
    display_name: string;
  } | null;
  wagers?: {
    title: string;
  } | null;
  tournament_matches?: {
    tournaments: {
      title: string;
    } | null;
  } | null;
}

interface GameSuggestion {
  id: string;
  game_name: string;
  display_name: string;
  description: string | null;
  platform: string[];
  image_url: string | null;
  status: string;
  created_at: string;
  user_id: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [gameSuggestions, setGameSuggestions] = useState<GameSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [hideTestData, setHideTestData] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  // Reload data when hideTestData changes
  useEffect(() => {
    if (user && analytics) {
      loadDashboardData();
    }
  }, [hideTestData]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single();

      if (!profile?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        return;
      }

      loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load analytics using the secure function
      const { data: analyticsArray } = await supabase
        .rpc('get_admin_analytics', { hide_test_data: hideTestData });
      
      const analyticsData = analyticsArray?.[0] || null;

      // Load recent users with test data filtering
      let usersQuery = supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          display_name,
          wallet_balance,
          is_premium,
          is_admin,
          total_wins,
          total_losses,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply test data filter if hideTestData is true - filter test accounts by username patterns
      if (hideTestData) {
        usersQuery = usersQuery.not('username', 'ilike', '%test%').not('display_name', 'ilike', '%test%');
      }

      const { data: usersData } = await usersQuery;

      // Load recent tournaments - simplified query with test data filtering
      console.log('Loading tournaments...');
      let tournamentsQuery = supabase
        .from('tournaments')
        .select(`
          id,
          title,
          status,
          current_participants,
          max_participants,
          prize_pool,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply test data filter if hideTestData is true - filter test tournaments by title patterns
      if (hideTestData) {
        tournamentsQuery = tournamentsQuery.not('title', 'ilike', '%test%');
      }

      const { data: tournamentsData, error: tournamentsError } = await tournamentsQuery;

      if (tournamentsError) {
        console.error('Tournament loading error:', tournamentsError);
      }
      
      console.log('Loaded tournaments:', tournamentsData);

      // Load disputes with test data filtering
      let disputesQuery = supabase
        .from('disputes')
        .select(`
          id,
          type,
          title,
          description,
          status,
          created_at,
          user_id,
          admin_response
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply test data filter if hideTestData is true - filter test disputes by title patterns
      if (hideTestData) {
        disputesQuery = disputesQuery.not('title', 'ilike', '%test%').not('description', 'ilike', '%test%');
      }

      const { data: disputesData } = await disputesQuery;

      // Get user profiles for disputes
      if (disputesData && disputesData.length > 0) {
        const userIds = disputesData.map(d => d.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);

        // Merge profiles with disputes
        const disputesWithProfiles = disputesData.map(dispute => ({
          ...dispute,
          profiles: profilesData?.find(p => p.user_id === dispute.user_id) || null
        }));
        
        setDisputes(disputesWithProfiles as Dispute[]);
      } else {
        setDisputes([]);
      }

      // Load game suggestions
      const { data: suggestionsData } = await supabase
        .from('game_suggestions')
        .select(`
          id,
          game_name,
          display_name,
          description,
          platform,
          image_url,
          status,
          created_at,
          user_id,
          reviewed_by,
          reviewed_at
        `)
        .order('created_at', { ascending: false });

      // Get user profiles for suggestions
      if (suggestionsData && suggestionsData.length > 0) {
        const suggestionUserIds = suggestionsData.map(s => s.user_id);
        const { data: suggestionProfilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', suggestionUserIds);

        // Merge profiles with suggestions
        const suggestionsWithProfiles = suggestionsData.map(suggestion => ({
          ...suggestion,
          profiles: suggestionProfilesData?.find(p => p.user_id === suggestion.user_id) || null
        }));
        
        setGameSuggestions(suggestionsWithProfiles as GameSuggestion[]);
      } else {
        setGameSuggestions([]);
      }

      setAnalytics(analyticsData);
      setUsers(usersData || []);
      setTournaments(tournamentsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUserProfile = async (userId: string) => {
    setDeletingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      await loadDashboardData();
      
      toast({
        title: "User Deleted",
        description: "User profile has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user profile.",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const resolveDispute = async (disputeId: string, status: 'resolved' | 'rejected', response: string) => {
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status,
          admin_response: response,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (error) throw error;

      // Refresh disputes
      await loadDashboardData();
      
      toast({
        title: "Dispute Updated",
        description: `Dispute has been ${status}.`,
      });

      setSelectedDispute(null);
      setAdminResponse('');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to update dispute.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestion = async (suggestionId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('game_suggestions')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Refresh data
      await loadDashboardData();
      
      toast({
        title: "Suggestion Updated",
        description: `Game suggestion has been ${action}.`,
      });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to update game suggestion.",
        variant: "destructive",
      });
    }
  };

  const generateBracket = async (tournamentId: string) => {
    console.log('Generate bracket clicked for tournament:', tournamentId);
    try {
      console.log('Invoking generate-tournament-bracket function...');
      const { error } = await supabase.functions.invoke('generate-tournament-bracket', {
        body: { tournamentId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Tournament bracket generated successfully');
      toast({
        title: "Tournament Started",
        description: "Tournament bracket has been generated and the tournament is now in progress.",
      });

      // Refresh tournament data
      await loadDashboardData();
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast({
        title: "Error",
        description: "Failed to start tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('emergency-tournament-stop', {
        body: { 
          tournamentId,
          reason: 'Manual cancellation by admin',
          refundType: 'full'
        }
      });

      if (error) throw error;

      toast({
        title: "Tournament Cancelled",
        description: "Tournament has been cancelled and refunds processed.",
      });

      // Refresh tournament data
      await loadDashboardData();
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      toast({
        title: "Error", 
        description: "Failed to cancel tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelInsufficientTournaments = async () => {
    try {
      // Get tournaments that are in progress but don't have enough players
      const { data: insufficientTournaments } = await supabase
        .from('tournaments')
        .select('id, title, current_participants, max_participants')
        .eq('status', 'in_progress')
        .lt('current_participants', 4); // Less than 4 players

      if (!insufficientTournaments || insufficientTournaments.length === 0) {
        toast({
          title: "No Action Needed",
          description: "All tournaments have sufficient participants.",
        });
        return;
      }

      // Cancel each insufficient tournament
      for (const tournament of insufficientTournaments) {
        await supabase.functions.invoke('emergency-tournament-stop', {
          body: { 
            tournamentId: tournament.id,
            reason: 'Insufficient participants - cancelled by admin',
            refundType: 'full'
          }
        });
      }

      toast({
        title: "Tournaments Cancelled",
        description: `Cancelled ${insufficientTournaments.length} tournaments with insufficient participants.`,
      });

      // Refresh tournament data
      await loadDashboardData();
    } catch (error) {
      console.error('Error cancelling insufficient tournaments:', error);
      toast({
        title: "Error", 
        description: "Failed to cancel insufficient tournaments.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'under_review':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'under_review':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const netRevenue = analytics ? analytics.total_deposits - analytics.total_withdrawals : 0;
  const premiumRevenue = analytics ? analytics.active_premium_users * 9.99 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-gaming text-primary flex items-center gap-2">
              <Shield className="w-8 h-8" />
              ADMIN DASHBOARD
            </h1>
            <p className="text-muted-foreground mt-2">Platform management and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectExportModal />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-16 max-w-8xl gap-1 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="passive-income" className="text-xs sm:text-sm">💰 Passive Income</TabsTrigger>
            <TabsTrigger value="matches" className="text-xs sm:text-sm">Matches</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs sm:text-sm">Roles</TabsTrigger>
            <TabsTrigger value="tournaments" className="text-xs sm:text-sm">Tournaments</TabsTrigger>
            <TabsTrigger value="disputes" className="text-xs sm:text-sm">Disputes</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs sm:text-sm">Suggestions</TabsTrigger>
            <TabsTrigger value="games" className="text-xs sm:text-sm">Games</TabsTrigger>
            <TabsTrigger value="automation" className="text-xs sm:text-sm">🤖 Automation</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="projections" className="text-xs sm:text-sm">💰 Projections</TabsTrigger>
            <TabsTrigger value="sponsor-hub" className="text-xs sm:text-sm">🎯 Sponsors</TabsTrigger>
            <TabsTrigger value="sponsor-admin" className="text-xs sm:text-sm">🏢 Sponsor Admin</TabsTrigger>
            <TabsTrigger value="xbox-live" className="text-xs sm:text-sm">🎮 Xbox Live</TabsTrigger>
            <TabsTrigger value="xbox-test" className="text-xs sm:text-sm">🧪 Xbox Test</TabsTrigger>
            <TabsTrigger value="system-test" className="text-xs sm:text-sm">🚀 Full Test</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Revenue</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${netRevenue.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 border-yellow-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Premium Revenue</p>
                      <p className="text-3xl font-bold text-yellow-600">
                        ${premiumRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.active_premium_users} subscribers
                      </p>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-600/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {analytics?.total_users || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{analytics?.new_users_this_week} this week
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/10 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tournaments</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {analytics?.total_tournaments || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{analytics?.tournaments_this_week} this week
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-purple-600/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Transactions Today</span>
                      <Badge variant="secondary">{analytics?.transactions_today || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Subscribers</span>
                      <Badge className="bg-yellow-600">{analytics?.active_premium_users || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Challenges</span>
                      <Badge variant="outline">{analytics?.total_challenges || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Users (7 days)</span>
                      <Badge variant="secondary">{analytics?.new_users_this_week || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Tournaments (7 days)</span>
                      <Badge variant="secondary">{analytics?.tournaments_this_week || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Conversion</span>
                      <Badge variant="outline">
                        {analytics?.total_users ? 
                          ((analytics.active_premium_users / analytics.total_users) * 100).toFixed(1) 
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Passive Income Tab */}
          <TabsContent value="passive-income" className="space-y-6">
            <PassiveIncomeController />
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <MatchManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.display_name || user.username || 'Unknown User'}
                          </span>
                          {user.is_premium && (
                            <Crown className="w-4 h-4 text-yellow-600" />
                          )}
                          {user.is_admin && (
                            <Shield className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Balance: ${user.wallet_balance || 0} • 
                          W/L: {user.total_wins || 0}/{user.total_losses || 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </Badge>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <UserX className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Profile?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {user.display_name || user.username}'s profile, 
                                including all their data, wagers, and history. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUserProfile(user.user_id)}
                                disabled={deletingUser === user.user_id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingUser === user.user_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete User'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <RoleManagement />
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Management
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={cancelInsufficientTournaments}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Insufficient Tournaments
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournaments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No tournaments found
                    </div>
                  ) : (
                    tournaments.map((tournament) => {
                      console.log('Rendering tournament:', tournament.title, 'status:', tournament.status, 'participants:', tournament.current_participants);
                      return (
                        <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{tournament.title}</div>
                            <div className="text-sm text-muted-foreground">
                              ${tournament.prize_pool} prize pool • 
                              {tournament.current_participants}/{tournament.max_participants} players
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                tournament.status === 'cancelled' ? 'destructive' :
                                tournament.status === 'completed' ? 'default' : 
                                tournament.status === 'in_progress' ? 'secondary' : 'outline'
                              }
                              className={`text-xs ${
                                tournament.status === 'cancelled' ? 'bg-red-500 text-white font-bold' :
                                tournament.status === 'in_progress' ? 'bg-yellow-500 text-black font-semibold' : ''
                              }`}
                            >
                              {tournament.status === 'cancelled' ? '❌ CANCELLED' :
                               tournament.status === 'in_progress' ? '🔄 IN PROGRESS' :
                               tournament.status.toUpperCase()}
                            </Badge>
                            
                            {/* Admin Actions */}
                            <div className="flex gap-1">
                              {tournament.status === 'open' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Button clicked for tournament:', tournament.id);
                                      generateBracket(tournament.id);
                                    }}
                                    className="text-xs bg-blue-500 text-white hover:bg-blue-600"
                                    disabled={false}
                                  >
                                    Start Tournament
                                    {tournament.current_participants < 2 && (
                                      <span className="ml-1 text-xs opacity-75">
                                        ({tournament.current_participants} players)
                                      </span>
                                    )}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Tournament?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will cancel "{tournament.title}" and issue full refunds to all participants. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => cancelTournament(tournament.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Yes, Cancel Tournament
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              ) : tournament.status !== 'completed' && tournament.status !== 'cancelled' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.open(`/tournaments`, '_blank');
                                    }}
                                    className="text-xs"
                                  >
                                    View Details
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Cancel
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Tournament?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will cancel "{tournament.title}" and issue full refunds to all participants. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => cancelTournament(tournament.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Yes, Cancel Tournament
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.open(`/tournaments`, '_blank');
                                  }}
                                  className="text-xs"
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <DisputeManagement />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Game Suggestions Management
                  <Badge variant="secondary">{gameSuggestions.filter(s => s.status === 'pending').length} pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gameSuggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No game suggestions found</p>
                    </div>
                  ) : (
                    gameSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{suggestion.display_name}</h4>
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(suggestion.status)}
                              >
                                {getStatusIcon(suggestion.status)}
                                <span className="ml-1">{suggestion.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Game Name:</strong> {suggestion.game_name}</p>
                              {suggestion.description && (
                                <p><strong>Description:</strong> {suggestion.description}</p>
                              )}
                              <p><strong>Platforms:</strong> {suggestion.platform.join(', ')}</p>
                              <p><strong>Suggested by:</strong> {suggestion.profiles?.display_name || suggestion.profiles?.username || 'Unknown User'}</p>
                              <p><strong>Date:</strong> {new Date(suggestion.created_at).toLocaleDateString()}</p>
                            </div>

                            {suggestion.image_url && (
                              <div className="mt-2">
                                <img 
                                  src={suggestion.image_url} 
                                  alt={suggestion.display_name}
                                  className="w-20 h-20 object-cover rounded border"
                                />
                              </div>
                            )}
                          </div>

                          {suggestion.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleSuggestion(suggestion.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleSuggestion(suggestion.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>

                        {suggestion.reviewed_at && (
                          <div className="pt-2 border-t text-xs text-muted-foreground">
                            Reviewed on {new Date(suggestion.reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 gap-8">
              <GameManagement />
              <AutomatedGameOptimization />
              <GamePerformanceAnalytics />
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <ProfitMaximizer />
            <AutomationDashboard />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Analytics
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hide-test-data" className="text-sm font-normal">
                      Hide Test Data
                    </Label>
                    <Switch
                      id="hide-test-data"
                      checked={hideTestData}
                      onCheckedChange={setHideTestData}
                    />
                  </div>
                </CardTitle>
                {!hideTestData && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Test Data Visible</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Showing all data including test entries. Toggle to see production data only.
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Transaction Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Deposits:</span>
                        <span className="font-medium">${analytics?.total_deposits.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Withdrawals:</span>
                        <span className="font-medium">${analytics?.total_withdrawals.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Net Revenue:</span>
                        <span className="font-bold text-green-600">${netRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Subscription Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Subscribers:</span>
                        <span className="font-medium">{analytics?.active_premium_users || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Recurring:</span>
                        <span className="font-medium">${premiumRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Annual Potential:</span>
                        <span className="font-bold text-yellow-600">${(premiumRevenue * 12).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Projections Tab */}
          <TabsContent value="projections" className="space-y-6">
            <MockRevenueProjection />
          </TabsContent>

          {/* Sponsor Hub Tab */}
          <TabsContent value="sponsor-hub" className="space-y-6">
            <SponsorDashboard />
          </TabsContent>

          {/* Sponsor Admin Panel Tab */}
          <TabsContent value="sponsor-admin" className="space-y-6">
            <SponsorAdminPanel />
          </TabsContent>

          {/* Xbox Live Integration Tab */}
          <TabsContent value="xbox-live" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <XboxAPIKeyManagement />
              <XboxLiveDashboard />
            </div>
          </TabsContent>

          {/* Xbox Integration Test Tab */}
          <TabsContent value="xbox-test" className="space-y-6">
            <XboxIntegrationTest />
          </TabsContent>

          {/* Comprehensive System Test Tab */}
          <TabsContent value="system-test" className="space-y-6">
            <ComprehensiveSystemTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;