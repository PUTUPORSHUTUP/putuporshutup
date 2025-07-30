import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, CheckCircle, Clock, Trophy, Gamepad2, Zap, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface XboxLiveStats {
  totalMatches: number;
  verifiedMatches: number;
  automatedPayouts: number;
  totalRevenue: number;
  activeVerifications: number;
  successRate: number;
}

interface VerificationQueue {
  id: string;
  challengeId: string;
  userId: string;
  gamertag: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedStats: any;
  createdAt: string;
  priority: number;
}

const XboxLiveDashboard: React.FC = () => {
  const [stats, setStats] = useState<XboxLiveStats>({
    totalMatches: 0,
    verifiedMatches: 0,
    automatedPayouts: 0,
    totalRevenue: 0,
    activeVerifications: 0,
    successRate: 0
  });
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueue[]>([]);
  const [autoVerificationEnabled, setAutoVerificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

  // PUOSU Xbox Live Configuration
  const XBOX_CONFIG = {
    titleId: "2140035565",
    scid: "00000000-0000-0000-0000-00007f8e521d",
    sandboxId: "BTWDGW.158"
  };

  useEffect(() => {
    loadXboxStats();
    loadVerificationQueue();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadXboxStats();
      loadVerificationQueue();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadXboxStats = async () => {
    try {
      // Fetch Xbox integration stats
      const { data: matches, error } = await supabase
        .from('xbox_match_history')
        .select('*');

      if (error) throw error;

      const { data: automatedActions } = await supabase
        .from('automated_actions')
        .select('*')
        .eq('automation_type', 'automated_payout');

      const totalMatches = matches?.length || 0;
      const verifiedMatches = matches?.filter(m => m.verification_source === 'xbox_live_api').length || 0;
      const automatedPayouts = automatedActions?.length || 0;
      
      setStats({
        totalMatches,
        verifiedMatches,
        automatedPayouts,
        totalRevenue: automatedPayouts * 25, // Estimated based on average challenge value
        activeVerifications: verificationQueue.filter(v => v.status === 'processing').length,
        successRate: totalMatches > 0 ? (verifiedMatches / totalMatches) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading Xbox stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerificationQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('xbox_verification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get profiles separately to avoid relation issues
      const userIds = data?.map(item => item.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, xbox_gamertag')
        .in('user_id', userIds);

      const queueData = data?.map(item => {
        const profile = profiles?.find(p => p.user_id === item.user_id);
        return {
          id: item.id,
          challengeId: item.challenge_id,
          userId: item.user_id,
          gamertag: profile?.xbox_gamertag || 'Unknown',
          status: item.status as 'pending' | 'processing' | 'completed' | 'failed',
          submittedStats: item.submitted_stats,
          createdAt: item.created_at,
          priority: item.priority
        };
      }) || [];

      setVerificationQueue(queueData);
    } catch (error) {
      console.error('Error loading verification queue:', error);
    }
  };

  const runManualVerification = async (challengeId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('xbox-match-verifier', {
        body: {
          action: 'auto_verify_challenge',
          challengeId: challengeId
        }
      });

      if (error) throw error;

      toast.success(`Verification completed for challenge ${challengeId}`);
      loadVerificationQueue();
      loadXboxStats();
    } catch (error) {
      console.error('Manual verification failed:', error);
      toast.error('Manual verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testXboxConnection = async () => {
    try {
      setTestMode(true);
      const { data, error } = await supabase.functions.invoke('xbox-profile-integration', {
        body: {
          action: 'verify_gamertag',
          gamertag: 'TestGamertag'
        }
      });

      if (error) throw error;

      toast.success('Xbox Live API connection successful!');
    } catch (error) {
      console.error('Xbox connection test failed:', error);
      toast.error('Xbox Live API connection failed');
    } finally {
      setTestMode(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎮 Xbox Live Integration Dashboard</h1>
        <p className="text-muted-foreground">
          PUOSU Xbox Live Creators Program • Title ID: {XBOX_CONFIG.titleId}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                    <p className="text-2xl font-bold">{stats.totalMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Verified</p>
                    <p className="text-2xl font-bold">{stats.verifiedMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Auto Payouts</p>
                    <p className="text-2xl font-bold">{stats.automatedPayouts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processing</p>
                    <p className="text-2xl font-bold">{stats.activeVerifications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  <Progress value={stats.successRate} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Xbox Live Integration Status</span>
                <Badge variant={autoVerificationEnabled ? "default" : "secondary"}>
                  {autoVerificationEnabled ? "Active" : "Paused"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title ID</Label>
                  <p className="text-lg font-mono">{XBOX_CONFIG.titleId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Service Config ID</Label>
                  <p className="text-lg font-mono">{XBOX_CONFIG.scid}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sandbox ID</Label>
                  <p className="text-lg font-mono">{XBOX_CONFIG.sandboxId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationQueue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending verifications
                  </p>
                ) : (
                  verificationQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="font-medium">{item.gamertag}</p>
                          <p className="text-sm text-muted-foreground">
                            Challenge: {item.challengeId.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(item.status)} text-white border-0`}
                        >
                          {item.status}
                        </Badge>
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => runManualVerification(item.challengeId)}
                            disabled={isLoading}
                          >
                            Verify Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Xbox Live Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Auto-Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically verify match results via Xbox Live API
                  </p>
                </div>
                <Switch
                  checked={autoVerificationEnabled}
                  onCheckedChange={setAutoVerificationEnabled}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titleId">Xbox Live Title ID</Label>
                  <Input 
                    id="titleId" 
                    value={XBOX_CONFIG.titleId} 
                    disabled 
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="scid">Service Configuration ID</Label>
                  <Input 
                    id="scid" 
                    value={XBOX_CONFIG.scid} 
                    disabled 
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sandboxId">Sandbox ID</Label>
                <Input 
                  id="sandboxId" 
                  value={XBOX_CONFIG.sandboxId} 
                  disabled 
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Xbox Live API Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  onClick={testXboxConnection}
                  disabled={testMode}
                  className="w-full"
                >
                  {testMode ? "Testing Xbox Live Connection..." : "Test Xbox Live API Connection"}
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">API Test Results</h4>
                <p className="text-sm text-muted-foreground">
                  Click the test button above to verify Xbox Live API connectivity and authentication.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Integration Features</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✅ Automatic match result verification</li>
                  <li>✅ Real-time leaderboard updates</li>
                  <li>✅ Instant payout processing</li>
                  <li>✅ Fraud detection and prevention</li>
                  <li>✅ Xbox Live profile linking</li>
                  <li>✅ Live tournament brackets</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XboxLiveDashboard;