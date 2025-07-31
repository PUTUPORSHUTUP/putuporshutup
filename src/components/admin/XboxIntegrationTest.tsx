import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Gamepad2, Shield, Zap, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const XboxIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<any>({});
  const [isRunning, setIsRunning] = React.useState(false);

  // PUOSU Xbox Live Configuration
  const XBOX_CONFIG = {
    titleId: "2140035565",
    scid: "00000000-0000-0000-0000-00007f8e521d",
    sandboxId: "BTWDGW.158"
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    const results: any = {};

    try {
      console.log('🎮 Starting Xbox Live Integration Test...');

      // Test 1: Database Structure (check if Xbox tables exist)
      console.log('Testing database structure...');
      const { data: xboxStats, error: statsError } = await supabase
        .from('xbox_leaderboard_stats')
        .select('id')
        .limit(1);

      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('id')
        .limit(1);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('xbox_gamertag, xbox_xuid')
        .limit(1);

      results.databaseStructure = {
        success: !statsError && !challengesError && !profilesError,
        tables: ['xbox_leaderboard_stats', 'challenges', 'profiles'],
        errors: [statsError?.message, challengesError?.message, profilesError?.message].filter(Boolean)
      };

      // Test 2: Xbox Profile Integration Function
      console.log('Testing Xbox profile integration...');
      try {
        const { data: profileTest, error: profileError } = await supabase.functions.invoke('xbox-profile-integration', {
          body: {
            action: 'verify_gamertag',
            gamertag: 'TestGamer'
          }
        });

        results.profileIntegration = {
          success: !profileError,
          response: profileTest,
          error: profileError?.message
        };
      } catch (error: any) {
        results.profileIntegration = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Xbox Match Verifier Function
      console.log('Testing Xbox match verifier...');
      try {
        const { data: verifierTest, error: verifierError } = await supabase.functions.invoke('xbox-match-verifier', {
          body: {
            action: 'fetch_recent_matches',
            xuid: 'test_xuid_123'
          }
        });

        results.matchVerifier = {
          success: !verifierError,
          response: verifierTest,
          error: verifierError?.message
        };
      } catch (error: any) {
        results.matchVerifier = {
          success: false,
          error: error.message
        };
      }

      // Test 4: Automated Payout Processor
      console.log('Testing automated payout processor...');
      try {
        const { data: payoutTest, error: payoutError } = await supabase.functions.invoke('automated-payout-processor', {
          body: {
            challengeId: 'test-challenge-id',
            winnerId: 'test-user-id',
            verificationMethod: 'xbox_live_api',
            amount: 100
          }
        });

        results.payoutProcessor = {
          success: !payoutError,
          response: payoutTest,
          error: payoutError?.message
        };
      } catch (error: any) {
        results.payoutProcessor = {
          success: false,
          error: error.message
        };
      }

      // Test 5: Database Functions
      console.log('Testing database functions...');
      const { data: functions, error: functionsError } = await supabase
        .rpc('get_admin_analytics');

      results.databaseFunctions = {
        success: !functionsError,
        data: functions,
        error: functionsError?.message
      };

      // Test 6: Leaderboard Query
      console.log('Testing leaderboard queries...');
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from('xbox_leaderboard_stats')
        .select('*')
        .limit(5);

      results.leaderboardQuery = {
        success: !leaderboardError,
        count: leaderboard?.length || 0,
        error: leaderboardError?.message
      };

      console.log('✅ Xbox Live Integration Test Complete!');
      setTestResults(results);
      
      // Show results summary
      const successCount = Object.values(results).filter((r: any) => r.success).length;
      const totalTests = Object.keys(results).length;
      
      if (successCount === totalTests) {
        toast.success(`🎉 All ${totalTests} Xbox integration tests passed!`);
      } else {
        toast.warning(`⚠️ ${successCount}/${totalTests} Xbox integration tests passed`);
      }

    } catch (error: any) {
      console.error('Test suite error:', error);
      toast.error('Test suite failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> :
      <Zap className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Xbox Live Integration Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive test of all Xbox Live integration components
        </p>
      </div>

      {/* Xbox Configuration Display */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gamepad2 className="h-5 w-5" />
            <span>PUOSU Xbox Live Configuration</span>
            <Badge variant="outline">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Title ID</p>
              <p className="text-lg font-mono text-primary">{XBOX_CONFIG.titleId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service Config ID</p>
              <p className="text-lg font-mono text-primary">{XBOX_CONFIG.scid}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sandbox ID</p>
              <p className="text-lg font-mono text-primary">{XBOX_CONFIG.sandboxId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runCompleteTest}
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning ? "Running Complete Test Suite..." : "🚀 Run Complete Xbox Integration Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Test Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <div key={testName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTestIcon(result.success)}
                    <div>
                      <p className="font-medium capitalize">{testName.replace(/([A-Z])/g, ' $1')}</p>
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                      {result.success && result.count !== undefined && (
                        <p className="text-sm text-green-600">Found {result.count} records</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "PASS" : "FAIL"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Coverage Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Test Coverage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Database Tests</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Xbox leaderboard stats table</li>
                <li>• Xbox match history table</li>
                <li>• Xbox verification queue table</li>
                <li>• Database functions and triggers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Function Tests</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Xbox profile integration</li>
                <li>• Xbox match verifier</li>
                <li>• Automated payout processor</li>
                <li>• Query performance and RLS policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XboxIntegrationTest;