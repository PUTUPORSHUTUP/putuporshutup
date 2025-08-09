import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityConfig {
  otp_expiry_minutes: number;
  breach_check: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  fraud_detection: boolean;
}

export const SecuritySettings = () => {
  const [config, setConfig] = useState<SecurityConfig>({
    otp_expiry_minutes: 3,
    breach_check: true,
    max_login_attempts: 3,
    lockout_duration_minutes: 5,
    fraud_detection: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityConfig();
  }, []);

  const loadSecurityConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('security_settings_get');

      if (error) throw error;

      if (data) {
        setConfig({
          otp_expiry_minutes: data.otp_expiry_minutes,
          breach_check: data.breach_check,
          max_login_attempts: data.max_login_attempts,
          lockout_duration_minutes: data.lockout_duration_minutes,
          fraud_detection: data.fraud_detection,
        });
      }
    } catch (error) {
      console.error('Error loading security config:', error);
      toast({
        title: "Error",
        description: "Failed to load security configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSecurityConfig = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('security_settings_save', {
        p_otp: config.otp_expiry_minutes,
        p_max_attempts: config.max_login_attempts,
        p_lockout: config.lockout_duration_minutes,
        p_breach: config.breach_check,
        p_fraud: config.fraud_detection,
      });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Security configuration has been updated.",
      });
    } catch (error) {
      console.error('Error saving security config:', error);
      toast({
        title: "Error",
        description: "Failed to save security configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      otp_expiry_minutes: 'Time in minutes before OTP codes expire',
      password_breach_check_enabled: 'Check passwords against known breaches database',
      max_login_attempts: 'Maximum login attempts before account lockout',
      lockout_duration_minutes: 'Duration of account lockout in minutes',
      require_strong_passwords: 'Enforce strong password requirements',
      fraud_detection_enabled: 'Enable automated fraud detection',
    };
    return descriptions[key] || '';
  };

  const updateConfig = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OTP Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            OTP Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="otp-expiry">OTP Expiry (minutes)</Label>
              <Input
                id="otp-expiry"
                type="number"
                min="1"
                max="15"
                value={config.otp_expiry_minutes}
                onChange={(e) => updateConfig('otp_expiry_minutes', parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 3-5 minutes for security
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="breach-check">Password Breach Check</Label>
                <Switch
                  id="breach-check"
                  checked={config.breach_check}
                  onCheckedChange={(checked) => updateConfig('breach_check', checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Check passwords against HaveIBeenPwned database
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Authentication Limits
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Max Login Attempts</Label>
              <Input
                id="max-attempts"
                type="number"
                min="3"
                max="10"
                value={config.max_login_attempts}
                onChange={(e) => updateConfig('max_login_attempts', parseInt(e.target.value) || 5)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout-duration"
                type="number"
                min="5"
                max="120"
                value={config.lockout_duration_minutes}
                onChange={(e) => updateConfig('lockout_duration_minutes', parseInt(e.target.value) || 15)}
              />
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Security Features
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="fraud-detection">Fraud Detection</Label>
                <p className="text-xs text-muted-foreground">
                  Enable automated fraud pattern detection
                </p>
              </div>
              <Switch
                id="fraud-detection"
                checked={config.fraud_detection}
                onCheckedChange={(checked) => updateConfig('fraud_detection', checked)}
              />
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Current Status</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant={config.otp_expiry_minutes <= 5 ? "default" : "secondary"}>
              OTP: {config.otp_expiry_minutes}min
            </Badge>
            <Badge variant={config.breach_check ? "default" : "secondary"}>
              {config.breach_check ? "Breach Check ON" : "Breach Check OFF"}
            </Badge>
            <Badge variant={config.fraud_detection ? "default" : "secondary"}>
              {config.fraud_detection ? "Fraud Detection ON" : "Fraud Detection OFF"}
            </Badge>
          </div>
        </div>

        <Button 
          onClick={saveSecurityConfig} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};