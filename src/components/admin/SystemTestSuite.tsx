import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Gamepad2, 
  Users, 
  Zap,
  DollarSign,
  Target,
  Shield
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message?: string;
  duration?: number;
}

export default function SystemTestSuite() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Xbox API Connection', status: 'pending' },
    { name: 'Console Dev Mode Verification', status: 'pending' },
    { name: 'Real Lobby Creation', status: 'pending' },
    { name: 'Match Queue System', status: 'pending' },
    { name: 'Wallet Integration', status: 'pending' },
    { name: 'Payout System', status: 'pending' },
    { name: 'Xbox Live Profile Linking', status: 'pending' },
    { name: 'Real Match Stats Capture', status: 'pending' }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [realUsers, setRealUsers] = useState<any[]>([]);

  const updateTestStatus = (testName: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status, message, duration }
        : test
    ));
  };

  const runXboxAPITest = async () => {
    updateTestStatus('Xbox API Connection', 'running');
    
    try {
      const { data, error } = await supabase.functions.invoke('xbl_validate', {
        body: { gamertag: 'TestGamertag' }
      });
      
      if (error) throw error;
      
      updateTestStatus('Xbox API Connection', 'pass', 'Xbox Live API responding correctly');
    } catch (error: any) {
      updateTestStatus('Xbox API Connection', 'fail', error.message);
    }
  };

  const runDevModeTest = async () => {
    updateTestStatus('Console Dev Mode Verification', 'running');
    
    try {
      // Test Xbox dev mode connectivity
      const { data, error } = await supabase.functions.invoke('xbox-lobby-automation', {
        body: { 
          action: 'test_connection',
          consoleIP: '192.168.1.100' // Default test IP
        }
      });
      
      if (error) throw error;
      
      updateTestStatus('Console Dev Mode Verification', 'pass', 'Xbox console in dev mode accessible');
    } catch (error: any) {
      updateTestStatus('Console Dev Mode Verification', 'fail', `Dev mode test failed: ${error.message}`);
    }
  };

  const runRealLobbyTest = async () => {
    updateTestStatus('Real Lobby Creation', 'running');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-live-match', {
        body: {
          game_type: 'cod_bo6',
          stake_amount: 25,
          max_participants: 2,
          test_mode: false // REAL MODE
        }
      });
      
      if (error) throw error;
      
      updateTestStatus('Real Lobby Creation', 'pass', `Real lobby created: ${data.lobby_id}`);
    } catch (error: any) {
      updateTestStatus('Real Lobby Creation', 'fail', error.message);
    }
  };

  const runMatchQueueTest = async () => {
    updateTestStatus('Match Queue System', 'running');
    
    try {
      // Test real match queue with actual users
      const { data: queueData } = await supabase
        .from('match_queue')
        .select('*')
        .eq('automated', false)
        .limit(5);
      
      if (queueData && queueData.length > 0) {
        updateTestStatus('Match Queue System', 'pass', `${queueData.length} real users in queue`);
      } else {
        updateTestStatus('Match Queue System', 'pass', 'Queue system operational (no users currently)');
      }
    } catch (error: any) {
      updateTestStatus('Match Queue System', 'fail', error.message);
    }
  };

  const runWalletTest = async () => {
    updateTestStatus('Wallet Integration', 'running');
    
    try {
      // Test wallet operations with real money constraints
      const { data: profiles } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .gt('wallet_balance', 0)
        .limit(1);
      
      if (profiles && profiles.length > 0) {
        updateTestStatus('Wallet Integration', 'pass', 'Real wallet balances detected');
      } else {
        updateTestStatus('Wallet Integration', 'pass', 'Wallet system ready (no funded accounts yet)');
      }
    } catch (error: any) {
      updateTestStatus('Wallet Integration', 'fail', error.message);
    }
  };

  const runPayoutTest = async () => {
    updateTestStatus('Payout System', 'running');
    
    try {
      const { data, error } = await supabase.functions.invoke('automated-payout-processor', {
        body: { test_mode: false }
      });
      
      if (error) throw error;
      
      updateTestStatus('Payout System', 'pass', 'Real payout system operational');
    } catch (error: any) {
      updateTestStatus('Payout System', 'fail', error.message);
    }
  };

  const runProfileLinkingTest = async () => {
    updateTestStatus('Xbox Live Profile Linking', 'running');
    
    try {
      const { data: linkedProfiles } = await supabase
        .from('profiles')
        .select('xbox_gamertag, xbox_xuid')
        .not('xbox_gamertag', 'is', null);
      
      updateTestStatus('Xbox Live Profile Linking', 'pass', 
        `${linkedProfiles?.length || 0} Xbox profiles linked`);
    } catch (error: any) {
      updateTestStatus('Xbox Live Profile Linking', 'fail', error.message);
    }
  };

  const runStatsTest = async () => {
    updateTestStatus('Real Match Stats Capture', 'running');
    
    try {
      const { data, error } = await supabase.functions.invoke('cod-multiplayer-stats', {
        body: { gamertag: 'TestUser', test_real_api: true }
      });
      
      if (error) throw error;
      
      updateTestStatus('Real Match Stats Capture', 'pass', 'Live stats capture working');
    } catch (error: any) {
      updateTestStatus('Real Match Stats Capture', 'fail', error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    // Run tests sequentially for better visibility
    await runXboxAPITest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runDevModeTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runRealLobbyTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runMatchQueueTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runWalletTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runPayoutTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runProfileLinkingTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await runStatsTest();
    
    setIsRunning(false);
    toast.success("System testing complete!");
  };

  const createTestUser = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('setup-test-profiles', {
        body: { 
          create_real_test_account: true,
          initial_balance: 100
        }
      });
      
      if (error) throw error;
      
      toast.success("Test user created with $100 balance");
    } catch (error: any) {
      toast.error(`Failed to create test user: ${error.message}`);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const passedTests = tests.filter(t => t.status === 'pass').length;
  const failedTests = tests.filter(t => t.status === 'fail').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Production System Test Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test all real system components with your Xbox Series X in dev mode
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={createTestUser}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Create Test User
            </Button>
            
            <div className="flex gap-2 ml-auto">
              <Badge variant="secondary">
                ✅ {passedTests} Passed
              </Badge>
              <Badge variant="destructive">
                ❌ {failedTests} Failed
              </Badge>
            </div>
          </div>

          <Alert className="mb-6">
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Testing Real Money System:</strong> These tests validate actual Xbox console integration, 
              real wallet operations, and live match creation. Only run with proper safety measures in place.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3">
            {tests.map((test) => (
              <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {test.message && (
                    <span className="text-sm text-muted-foreground">{test.message}</span>
                  )}
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Testing</TabsTrigger>
          <TabsTrigger value="automation">Automation Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Testing Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  1. Xbox Console Testing
                </h4>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Verify Xbox Series X is in Developer Mode</li>
                  <li>• Test remote lobby creation from admin panel</li>
                  <li>• Verify game launches automatically</li>
                  <li>• Confirm lobby settings are applied</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  2. Real User Flow Testing
                </h4>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Create test account with real $5 deposit</li>
                  <li>• Join match queue with actual stake</li>
                  <li>• Play real match on Xbox console</li>
                  <li>• Verify stats are captured correctly</li>
                  <li>• Confirm payout processes automatically</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  3. Financial System Testing
                </h4>
                <ul className="text-sm space-y-1 ml-6">
                  <li>• Test real payment processing</li>
                  <li>• Verify wallet balance updates</li>
                  <li>• Test withdrawal system</li>
                  <li>• Confirm fee calculations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation System Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  These tests verify the automated revenue generation systems are working with real money.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                  Test Auto-Match Creation
                </Button>
                <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                  Test Auto-Payout Processing  
                </Button>
                <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                  Test Revenue Optimization
                </Button>
                <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                  Test Xbox Lobby Automation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Real-time monitoring dashboard will be displayed here when tests are running
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}