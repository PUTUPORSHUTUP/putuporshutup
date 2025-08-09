import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Bell, 
  Phone, 
  Mail,
  Activity,
  DollarSign
} from 'lucide-react';

interface SystemMetrics {
  error_rate_5m: number;
  payout_deviation_sigma: number;
  current_payouts_cents: number;
  historical_mean_cents: number;
}

interface SystemAlert {
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  threshold: number;
}

interface MonitoringData {
  success: boolean;
  timestamp: string;
  metrics: SystemMetrics;
  alerts: SystemAlert[];
}

export const SystemMonitoring = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertConfig, setAlertConfig] = useState({
    error_rate_threshold: 5,
    payout_deviation_threshold: 2,
    notification_email: '',
    notification_phone: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAlertConfig();
    runSystemCheck();

    // Set up auto-refresh every 5 minutes
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        runSystemCheck();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadAlertConfig = async () => {
    try {
      const { data } = await supabase
        .from('api_configurations')
        .select('config_key, config_value')
        .in('config_key', [
          'alert_error_rate_threshold',
          'alert_payout_deviation_threshold',
          'alert_notification_email',
          'alert_notification_phone'
        ]);

      if (data) {
        const config = { ...alertConfig };
        data.forEach(item => {
          switch (item.config_key) {
            case 'alert_error_rate_threshold':
              config.error_rate_threshold = parseFloat(item.config_value);
              break;
            case 'alert_payout_deviation_threshold':
              config.payout_deviation_threshold = parseFloat(item.config_value);
              break;
            case 'alert_notification_email':
              config.notification_email = item.config_value;
              break;
            case 'alert_notification_phone':
              config.notification_phone = item.config_value;
              break;
          }
        });
        setAlertConfig(config);
      }
    } catch (error) {
      console.error('Error loading alert config:', error);
    }
  };

  const saveAlertConfig = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'alert_error_rate_threshold', value: alertConfig.error_rate_threshold.toString() },
        { key: 'alert_payout_deviation_threshold', value: alertConfig.payout_deviation_threshold.toString() },
        { key: 'alert_notification_email', value: alertConfig.notification_email },
        { key: 'alert_notification_phone', value: alertConfig.notification_phone },
      ];

      for (const update of updates) {
        await supabase
          .from('api_configurations')
          .upsert({
            config_key: update.key,
            config_value: update.value,
            description: getConfigDescription(update.key),
          });
      }

      toast({
        title: "Settings Saved",
        description: "Alert configuration has been updated.",
      });
    } catch (error) {
      console.error('Error saving alert config:', error);
      toast({
        title: "Error",
        description: "Failed to save alert configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      alert_error_rate_threshold: 'Error rate threshold percentage for alerts',
      alert_payout_deviation_threshold: 'Payout deviation threshold in standard deviations',
      alert_notification_email: 'Email address for alert notifications',
      alert_notification_phone: 'Phone number for SMS alert notifications',
    };
    return descriptions[key] || '';
  };

  const runSystemCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-monitor');
      
      if (error) throw error;
      
      setMonitoringData(data);
    } catch (error) {
      console.error('Error running system check:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to run system health check.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM': return <TrendingUp className="h-4 w-4" />;
      case 'LOW': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={autoRefresh ? "default" : "secondary"}>
              {autoRefresh ? "Auto-refresh ON" : "Manual"}
            </Badge>
            <Button
              onClick={runSystemCheck}
              disabled={loading}
              size="sm"
            >
              {loading ? "Checking..." : "Check Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {monitoringData && (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Error Rate (5m)</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {monitoringData.metrics.error_rate_5m.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {alertConfig.error_rate_threshold}%
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Payout Deviation</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {monitoringData.metrics.payout_deviation_sigma.toFixed(1)}σ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {alertConfig.payout_deviation_threshold}σ
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Current Payouts</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ${(monitoringData.metrics.current_payouts_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    24h total
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    monitoringData.alerts.length === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {monitoringData.alerts.length === 0 ? 'All Systems Normal' : 
                     `${monitoringData.alerts.length} Alert(s) Active`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last check: {new Date(monitoringData.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Active Alerts */}
              {monitoringData.alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Active Alerts</h4>
                  {monitoringData.alerts.map((alert, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="error-threshold">Error Rate Threshold (%)</Label>
              <Input
                id="error-threshold"
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={alertConfig.error_rate_threshold}
                onChange={(e) => setAlertConfig(prev => ({
                  ...prev,
                  error_rate_threshold: parseFloat(e.target.value) || 5
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payout-threshold">Payout Deviation Threshold (σ)</Label>
              <Input
                id="payout-threshold"
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={alertConfig.payout_deviation_threshold}
                onChange={(e) => setAlertConfig(prev => ({
                  ...prev,
                  payout_deviation_threshold: parseFloat(e.target.value) || 2
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-alerts" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <Input
                id="email-alerts"
                type="email"
                placeholder="admin@example.com"
                value={alertConfig.notification_email}
                onChange={(e) => setAlertConfig(prev => ({
                  ...prev,
                  notification_email: e.target.value
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sms-alerts" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                SMS Notifications
              </Label>
              <Input
                id="sms-alerts"
                type="tel"
                placeholder="+1234567890"
                value={alertConfig.notification_phone}
                onChange={(e) => setAlertConfig(prev => ({
                  ...prev,
                  notification_phone: e.target.value
                }))}
              />
            </div>
          </div>

          <Button 
            onClick={saveAlertConfig} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Alert Configuration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};