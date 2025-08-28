import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  Play,
  Activity,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Bot
} from 'lucide-react';

interface AutomationStats {
  active_tournaments: number;
  processed_today: number;
  success_rate: number;
  total_prize_pool: number;
  last_execution: string;
}

export const AdminAutomationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadAutomationStats();
      loadExecutionLogs();
    }
  }, [user]);

  const loadAutomationStats = async () => {
    try {
      // Get active tournaments count
      const { count: activeTournaments } = await supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['upcoming', 'registration_open', 'ongoing']);

      // Get today's processed tournaments
      const today = new Date().toISOString().split('T')[0];
      const { count: processedToday } = await supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get total prize pool
      const { data: prizeData } = await supabase
        .from('tournaments')
        .select('prize_pool')
        .in('status', ['registration_open', 'ongoing']);

      const totalPrizePool = prizeData?.reduce((sum, t) => sum + t.prize_pool, 0) || 0;

      setStats({
        active_tournaments: activeTournaments || 0,
        processed_today: processedToday || 0,
        success_rate: 0.98, // Placeholder - would come from actual monitoring
        total_prize_pool: totalPrizePool,
        last_execution: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading automation stats:', error);
    }
  };

  const loadExecutionLogs = async () => {
    try {
      // This would typically come from a logs table or monitoring system
      // For now, creating mock data
      setExecutionLogs([
        {
          id: '1',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          action: 'Tournament Creation',
          status: 'success',
          details: 'Created 2 new tournaments'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          action: 'Registration Management',
          status: 'success',
          details: 'Opened registration for 1 tournament'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          action: 'Tournament Completion',
          status: 'success',
          details: 'Processed prizes for completed tournament'
        }
      ]);
    } catch (error) {
      console.error('Error loading execution logs:', error);
    }
  };

  const runAutomationCycle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tournament-automation', {
        body: { manual_trigger: true }
      });

      if (error) throw error;

      toast({
        title: "Automation Cycle Complete",
        description: `Processed tournaments successfully`,
      });

      // Reload stats and logs
      loadAutomationStats();
      loadExecutionLogs();
    } catch (error: any) {
      toast({
        title: "Automation Failed",
        description: error.message || "Failed to run automation cycle",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Automation Engine
          </h2>
          <p className="text-muted-foreground">
            Monitor and control the PUOSU automated tournament system
          </p>
        </div>
        <Button onClick={runAutomationCycle} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run Cycle
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tournaments</p>
                  <p className="text-2xl font-bold">{stats.active_tournaments}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processed Today</p>
                  <p className="text-2xl font-bold">{stats.processed_today}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{(stats.success_rate * 100).toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-2xl font-bold">${stats.total_prize_pool.toFixed(0)}</p>
                </div>
                <Database className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Automation Engine: Active</span>
            </div>
            <Badge variant="outline">
              Cron: Every 5 minutes
            </Badge>
            <Badge variant="outline">
              Last Run: {stats ? new Date(stats.last_execution).toLocaleTimeString() : 'Loading...'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionLogs.map((log) => (
              <div 
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={log.status === 'success' ? 'default' : 
                            log.status === 'error' ? 'destructive' : 'secondary'}
                  >
                    {log.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};