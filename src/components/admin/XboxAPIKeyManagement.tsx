import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function XboxAPIKeyManagement() {
  const [keyStatus, setKeyStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const { toast } = useToast();

  const testXboxAPIKey = async () => {
    setIsTestingKey(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-profile-integration', {
        body: {
          action: 'verify_gamertag',
          gamertag: 'TestGamertag123456789' // Known non-existent gamertag for testing
        }
      });

      if (error && error.message?.includes('API key')) {
        setKeyStatus('inactive');
        toast({
          title: "Xbox API Key Invalid",
          description: "The Xbox API key is not configured or invalid",
          variant: "destructive",
        });
      } else {
        setKeyStatus('active');
        toast({
          title: "Xbox API Key Active",
          description: "Xbox API integration is working correctly",
        });
      }
    } catch (error) {
      console.error('Xbox API test error:', error);
      setKeyStatus('error');
      toast({
        title: "Connection Error",
        description: "Unable to test Xbox API connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingKey(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    testXboxAPIKey();
  }, []);

  const getStatusBadge = () => {
    switch (keyStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      case 'error':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Checking</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Xbox API Configuration
        </CardTitle>
        <CardDescription>
          Manage Xbox Live API integration for automated stat verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">API Status</p>
            <p className="text-sm text-muted-foreground">
              {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Not tested yet'}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testXboxAPIKey} 
            disabled={isTestingKey}
            variant="outline"
            size="sm"
          >
            {isTestingKey ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
          <p className="font-medium">Configuration Notes:</p>
          <p>• Xbox API key is managed through Supabase secrets</p>
          <p>• Used for gamertag verification and stat retrieval</p>
          <p>• Required for automated challenge verification</p>
        </div>

        {keyStatus === 'inactive' && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              Xbox API key needs to be configured in project settings for stat verification to work.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}