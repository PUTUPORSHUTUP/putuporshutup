import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthMetrics {
  timestamp: string;
  market_engine: {
    success_rate: number;
    avg_duration_ms: number;
    total_cycles_24h: number;
  };
  player_pool: {
    total_test_users: number;
    active_balance_users: number;
    avg_balance: number;
  };
  financial_integrity: {
    successful_payouts_24h: number;
    total_payout_amount_24h: number;
  };
  system_status: 'healthy' | 'warning' | 'critical';
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  resolved: boolean;
}

interface HealthResponse {
  success: boolean;
  platform_health: HealthMetrics;
  critical_alerts: SystemAlert[];
  alerts_generated: string[];
  recommendations: string[];
  execution_time_ms: number;
}

export const PlatformHealthDashboard = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('platform-health-monitor');
      
      if (error) throw error;
      
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchHealthData, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading && !healthData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Health Monitor Unavailable</h3>
            <p className="text-muted-foreground mb-4">Failed to fetch platform health data</p>
            <Button onClick={fetchHealthData}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { platform_health: health } = healthData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Health Dashboard</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString()} 
            {healthData.execution_time_ms && ` (${healthData.execution_time_ms}ms)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(health.system_status)}
          <Badge className={getStatusColor(health.system_status)}>
            {health.system_status.toUpperCase()}
          </Badge>
          <Button onClick={fetchHealthData} disabled={loading}>
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.market_engine.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {health.market_engine.total_cycles_24h} cycles (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(health.market_engine.avg_duration_ms)}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;15s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.player_pool.active_balance_users}</div>
            <p className="text-xs text-muted-foreground">
              / {health.player_pool.total_test_users} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payouts (24h)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.financial_integrity.successful_payouts_24h}</div>
            <p className="text-xs text-muted-foreground">
              ${(health.financial_integrity.total_payout_amount_24h / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {healthData.critical_alerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.critical_alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{alert.alert_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>System Recommendations</CardTitle>
          <CardDescription>
            Automated analysis and actionable insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {healthData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {healthData.alerts_generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Alerts generated during this health check
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.alerts_generated.map((alert, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};