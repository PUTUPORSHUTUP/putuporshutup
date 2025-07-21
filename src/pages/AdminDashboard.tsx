import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { DisputeManagement } from '@/components/admin/DisputeManagement';

interface AdminAnalytics {
  total_deposits: number;
  total_withdrawals: number;
  active_premium_users: number;
  total_users: number;
  total_tournaments: number;
  total_wagers: number;
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

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

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
      // Load analytics
      const { data: analyticsData } = await supabase
        .from('admin_analytics')
        .select('*')
        .single();

      // Load recent users
      const { data: usersData } = await supabase
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

      // Load recent tournaments - simplified query
      const { data: tournamentsData } = await supabase
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

      // Load disputes with simpler query
      const { data: disputesData } = await supabase
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <span className="text-sm">Total Wagers</span>
                      <Badge variant="outline">{analytics?.total_wagers || 0}</Badge>
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournaments.map((tournament) => (
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
                          variant={tournament.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {tournament.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <DisputeManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Analytics
                </CardTitle>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;