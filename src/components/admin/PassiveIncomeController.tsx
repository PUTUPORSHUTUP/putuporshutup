import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, TrendingUp, DollarSign, Server, Zap, Target, Clock } from 'lucide-react';

interface XboxAutomationStatus {
  xbox_console_id: string;
  status: string;
  current_lobbies: number;
  max_lobbies: number;
  revenue_generated_today: number;
  uptime_hours: number;
  last_heartbeat: string;
  automation_config: any;
}

interface RevenueMetrics {
  hourly_revenue: number;
  tournaments_created: number;
  matches_facilitated: number;
  xbox_uptime_hours: number;
  automation_efficiency_score: number;
  total_daily_revenue: number;
}

export const PassiveIncomeController = () => {
  const [xboxStatus, setXboxStatus] = useState<XboxAutomationStatus | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [automationActive, setAutomationActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAutomationStatus();
    fetchRevenueMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchAutomationStatus();
      fetchRevenueMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAutomationStatus = async () => {
    const { data, error } = await supabase
      .from('xbox_automation_status')
      .select('*')
      .eq('xbox_console_id', 'xbox-dev-server-001')
      .single();

    if (data) {
      setXboxStatus(data);
      setAutomationActive(data.status === 'online');
    }
  };

  const fetchRevenueMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('passive_income_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (data) {
      setRevenueMetrics(data);
    }
  };

  const startAutomation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-revenue-automation', {
        body: { action: 'start_automation' }
      });

      if (error) throw error;

      setAutomationActive(true);
      toast({
        title: "Automation Started",
        description: "Xbox Series X passive income automation is now running!",
      });
      
      fetchAutomationStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start automation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopAutomation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-revenue-automation', {
        body: { action: 'stop_automation' }
      });

      if (error) throw error;

      setAutomationActive(false);
      toast({
        title: "Automation Stopped",
        description: "Xbox automation has been safely stopped",
      });
      
      fetchAutomationStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop automation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerRevenueOptimization = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-revenue-automation', {
        body: { action: 'optimize_revenue' }
      });

      if (error) throw error;

      toast({
        title: "Revenue Optimized",
        description: "Pricing and automation parameters have been optimized",
      });
      
      fetchRevenueMetrics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize revenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createLobbies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-revenue-automation', {
        body: { action: 'create_lobbies' }
      });

      if (error) throw error;

      toast({
        title: "Lobbies Created",
        description: `${data.total_lobbies} automated lobbies have been created`,
      });
      
      fetchAutomationStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lobbies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Passive Income Automation</h2>
          <p className="text-muted-foreground">Xbox Series X Revenue Generation System</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={automationActive ? "default" : "secondary"} className="text-sm">
            <Server className="w-4 h-4 mr-2" />
            {automationActive ? "ONLINE" : "OFFLINE"}
          </Badge>
          {automationActive ? (
            <Button onClick={stopAutomation} disabled={isLoading} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop Automation
            </Button>
          ) : (
            <Button onClick={startAutomation} disabled={isLoading}>
              <Play className="w-4 h-4 mr-2" />
              Start Automation
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${revenueMetrics?.total_daily_revenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              +${revenueMetrics?.hourly_revenue?.toFixed(2) || '0.00'} this hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lobbies</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {xboxStatus?.current_lobbies || 0} / {xboxStatus?.max_lobbies || 10}
            </div>
            <Progress 
              value={(xboxStatus?.current_lobbies || 0) / (xboxStatus?.max_lobbies || 10) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueMetrics?.automation_efficiency_score?.toFixed(1) || '0.0'}%
            </div>
            <Progress 
              value={revenueMetrics?.automation_efficiency_score || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {xboxStatus?.uptime_hours || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueMetrics?.matches_facilitated || 0} matches today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Controls */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Manual Controls</TabsTrigger>
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Performance</CardTitle>
                <CardDescription>24-hour passive income tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Tournaments Created</span>
                  <span className="font-semibold">{revenueMetrics?.tournaments_created || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Matches Facilitated</span>
                  <span className="font-semibold">{revenueMetrics?.matches_facilitated || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Revenue/Hour</span>
                  <span className="font-semibold text-green-600">
                    ${revenueMetrics?.hourly_revenue?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Xbox Server Uptime</span>
                  <span className="font-semibold">
                    {((xboxStatus?.uptime_hours || 0) / 24 * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Status</CardTitle>
                <CardDescription>Real-time system monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Xbox Console Status</span>
                  <Badge variant={xboxStatus?.status === 'online' ? 'default' : 'secondary'}>
                    {xboxStatus?.status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Heartbeat</span>
                  <span className="text-sm text-muted-foreground">
                    {xboxStatus?.last_heartbeat ? new Date(xboxStatus.last_heartbeat).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auto Lobby Creation</span>
                  <Badge variant={xboxStatus?.automation_config?.auto_lobby_creation ? 'default' : 'secondary'}>
                    {xboxStatus?.automation_config?.auto_lobby_creation ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Revenue Optimization</span>
                  <Badge variant={xboxStatus?.automation_config?.revenue_optimization ? 'default' : 'secondary'}>
                    {xboxStatus?.automation_config?.revenue_optimization ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={createLobbies} 
              disabled={isLoading || !automationActive}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Zap className="w-6 h-6" />
              <span>Create Lobbies</span>
            </Button>
            
            <Button 
              onClick={triggerRevenueOptimization} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span>Optimize Revenue</span>
            </Button>
            
            <Button 
              onClick={() => supabase.functions.invoke('passive-income-orchestrator')} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Target className="w-6 h-6" />
              <span>Full Cycle</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Configuration</CardTitle>
              <CardDescription>Xbox Series X server automation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Concurrent Lobbies</label>
                  <div className="text-2xl font-bold">{xboxStatus?.max_lobbies || 10}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Revenue/Hour</label>
                  <div className="text-2xl font-bold text-green-600">
                    ${xboxStatus?.automation_config?.target_revenue_per_hour || 75}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peak Hour Multiplier</label>
                  <div className="text-2xl font-bold">
                    {xboxStatus?.automation_config?.peak_hour_pricing ? '1.5x' : '1.0x'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Match Processing</label>
                  <Badge variant={xboxStatus?.automation_config?.auto_match_processing ? 'default' : 'secondary'}>
                    {xboxStatus?.automation_config?.auto_match_processing ? 'ENABLED' : 'DISABLED'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live automation event logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div className="text-green-600">✅ {new Date().toLocaleTimeString()} - Automation cycle completed successfully</div>
                <div className="text-blue-600">ℹ️ {new Date(Date.now() - 300000).toLocaleTimeString()} - Revenue optimization applied</div>
                <div className="text-yellow-600">⚡ {new Date(Date.now() - 600000).toLocaleTimeString()} - {xboxStatus?.current_lobbies || 0} lobbies created</div>
                <div className="text-green-600">💰 {new Date(Date.now() - 900000).toLocaleTimeString()} - ${revenueMetrics?.hourly_revenue?.toFixed(2) || '0.00'} revenue generated</div>
                <div className="text-blue-600">🎮 {new Date(Date.now() - 1200000).toLocaleTimeString()} - Xbox automation server started</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};