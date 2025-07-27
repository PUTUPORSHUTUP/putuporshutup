import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Zap,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TrendingGamesService from '@/services/trendingGamesService';
import { toast } from '@/hooks/use-toast';

interface OptimizationSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: Date | null;
  nextRun: Date | null;
  autoApprove: boolean;
  minRevenueThreshold: number;
  maxGamesCount: number;
}

interface OptimizationLog {
  id: string;
  timestamp: Date;
  action: 'optimization_run' | 'games_added' | 'games_removed';
  details: string;
  success: boolean;
  gamesAdded: number;
  gamesRemoved: number;
  potentialRevenue: number;
}

export const AutomatedGameOptimization = () => {
  const [schedule, setSchedule] = useState<OptimizationSchedule>({
    enabled: false,
    frequency: 'weekly',
    lastRun: null,
    nextRun: null,
    autoApprove: true,
    minRevenueThreshold: 50,
    maxGamesCount: 25
  });

  const [logs, setLogs] = useState<OptimizationLog[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadOptimizationData();
    checkRecommendations();
  }, []);

  const loadOptimizationData = async () => {
    // In a real implementation, this would load from database
    // For now, using localStorage to simulate persistence
    const savedSchedule = localStorage.getItem('gameOptimizationSchedule');
    if (savedSchedule) {
      const parsed = JSON.parse(savedSchedule);
      setSchedule({
        ...parsed,
        lastRun: parsed.lastRun ? new Date(parsed.lastRun) : null,
        nextRun: parsed.nextRun ? new Date(parsed.nextRun) : null
      });
    }

    const savedLogs = localStorage.getItem('gameOptimizationLogs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      setLogs(parsed.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      })));
    }
  };

  const saveSchedule = (newSchedule: OptimizationSchedule) => {
    localStorage.setItem('gameOptimizationSchedule', JSON.stringify(newSchedule));
    setSchedule(newSchedule);
  };

  const addLog = (log: Omit<OptimizationLog, 'id' | 'timestamp'>) => {
    const newLog: OptimizationLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50 logs
    setLogs(updatedLogs);
    localStorage.setItem('gameOptimizationLogs', JSON.stringify(updatedLogs));
  };

  const checkRecommendations = async () => {
    try {
      const recs = await TrendingGamesService.getOptimizationRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Error checking recommendations:', error);
    }
  };

  const runOptimization = async () => {
    setRunning(true);
    setProgress(0);

    try {
      setProgress(25);
      
      // Check current status
      const recs = await TrendingGamesService.getOptimizationRecommendations();
      setProgress(50);

      if (!recs.shouldOptimize) {
        addLog({
          action: 'optimization_run',
          details: 'No optimization needed - games list is already optimal',
          success: true,
          gamesAdded: 0,
          gamesRemoved: 0,
          potentialRevenue: 0
        });
        
        toast({
          title: "Optimization Complete",
          description: "Games list is already optimized",
        });
        setProgress(100);
        return;
      }

      setProgress(75);

      // Run optimization
      const result = await TrendingGamesService.optimizeGamesList();
      
      setProgress(100);

      // Log the results
      addLog({
        action: 'optimization_run',
        details: result.message,
        success: true,
        gamesAdded: result.added.length,
        gamesRemoved: result.removed.length,
        potentialRevenue: result.added.reduce((sum, game) => sum + game.estimated_revenue_potential, 0)
      });

      // Update schedule
      const now = new Date();
      const nextRun = new Date(now);
      
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(now.getMonth() + 1);
          break;
      }

      saveSchedule({
        ...schedule,
        lastRun: now,
        nextRun
      });

      // Refresh recommendations
      await checkRecommendations();

      toast({
        title: "Optimization Complete",
        description: result.message,
      });

    } catch (error) {
      console.error('Optimization failed:', error);
      
      addLog({
        action: 'optimization_run',
        details: `Optimization failed: ${error}`,
        success: false,
        gamesAdded: 0,
        gamesRemoved: 0,
        potentialRevenue: 0
      });

      toast({
        title: "Optimization Failed",
        description: "Failed to optimize games list",
        variant: "destructive"
      });
    } finally {
      setRunning(false);
      setProgress(0);
    }
  };

  const toggleAutomation = (enabled: boolean) => {
    const now = new Date();
    let nextRun = null;

    if (enabled) {
      nextRun = new Date(now);
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(now.getMonth() + 1);
          break;
      }
    }

    saveSchedule({
      ...schedule,
      enabled,
      nextRun
    });
  };

  const updateFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    let nextRun = null;

    if (schedule.enabled) {
      nextRun = new Date(now);
      switch (frequency) {
        case 'daily':
          nextRun.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(now.getMonth() + 1);
          break;
      }
    }

    saveSchedule({
      ...schedule,
      frequency,
      nextRun
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automated Game Optimization</h2>
          <p className="text-muted-foreground">Maintain top 25 revenue-generating games automatically</p>
        </div>
        <Button onClick={runOptimization} disabled={running} size="lg">
          {running ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Now
            </>
          )}
        </Button>
      </div>

      {running && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Optimization in progress...</p>
                <Progress value={progress} className="w-full" />
              </div>
              <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Automated Optimization</p>
              <p className="text-sm text-muted-foreground">
                Automatically maintain optimal games list based on revenue data
              </p>
            </div>
            <Switch 
              checked={schedule.enabled} 
              onCheckedChange={toggleAutomation}
            />
          </div>

          {schedule.enabled && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <p className="font-medium mb-2">Optimization Frequency</p>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map((freq) => (
                    <Button
                      key={freq}
                      variant={schedule.frequency === freq ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFrequency(freq as any)}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Run:</p>
                  <p className="font-medium">
                    {schedule.lastRun ? schedule.lastRun.toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Run:</p>
                  <p className="font-medium">
                    {schedule.nextRun ? schedule.nextRun.toLocaleString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Recommendations */}
      {recommendations && (
        <Card className={recommendations.shouldOptimize ? "border-amber-200" : "border-green-200"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {recommendations.shouldOptimize ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.shouldOptimize ? (
              <div className="space-y-3">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Optimization recommended - Potential revenue increase: ${recommendations.potentialRevenue}/month
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <p className="font-medium text-sm">Recommendations:</p>
                  {recommendations.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Games list is optimized - All top revenue-generating games are active
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Optimization History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Optimization History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No optimization history yet</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{log.details}</p>
                      <Badge variant="outline" className="text-xs">
                        {log.timestamp.toLocaleString()}
                      </Badge>
                    </div>
                    
                    {(log.gamesAdded > 0 || log.gamesRemoved > 0) && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {log.gamesAdded > 0 && (
                          <span>+{log.gamesAdded} games added</span>
                        )}
                        {log.gamesRemoved > 0 && (
                          <span>-{log.gamesRemoved} games removed</span>
                        )}
                        {log.potentialRevenue > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            +${log.potentialRevenue}/month potential
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};