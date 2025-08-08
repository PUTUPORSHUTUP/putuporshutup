import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { apiClient, type DiagnosticLog } from '@/lib/apiClient';
import { supabase } from '@/integrations/supabase/client';

export const ApiDiagnosticsPanel = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      // Get client-side logs
      const clientLogs = apiClient.getDiagnosticLogs();
      setLogs(clientLogs);

      // Get server-side logs from Supabase
      const { data: serverData } = await supabase
        .from('payout_automation_log')
        .select('*')
        .eq('event_type', 'api_diagnostic')
        .order('created_at', { ascending: false })
        .limit(50);

      setServerLogs(serverData || []);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    apiClient.clearDiagnosticLogs();
    setLogs([]);
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    if (status >= 500) return 'text-red-500';
    return 'text-gray-500';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status >= 400) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const LogCard = ({ log, isServer = false }: { log: any; isServer?: boolean }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(isServer ? (log.metadata?.status || 0) : log.status)}
            <CardTitle className="text-sm">
              {isServer ? log.entity_id : log.endpoint}
            </CardTitle>
            <Badge variant={
              (isServer ? (log.metadata?.status || 0) : log.status) >= 400 ? 'destructive' : 'default'
            }>
              {isServer ? (log.metadata?.status || 'N/A') : log.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(isServer ? log.created_at : log.timestamp).toLocaleString()}
          </div>
        </div>
        {(isServer ? log.error_message : log.error) && (
          <CardDescription className="text-red-600">
            {isServer ? log.error_message : log.error}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {(isServer ? log.metadata?.responseTime : log.responseTime) && (
            <div>
              <strong>Response Time:</strong> {isServer ? log.metadata.responseTime : log.responseTime}ms
            </div>
          )}
          {(isServer ? log.metadata?.headers : log.headers) && (
            <div>
              <strong>Headers:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(isServer ? log.metadata.headers : log.headers, null, 2)}
              </pre>
            </div>
          )}
          {(isServer ? log.metadata?.body : log.body) && (
            <div className="md:col-span-2">
              <strong>Request Body:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {JSON.stringify(isServer ? log.metadata.body : log.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Diagnostics</h2>
          <p className="text-muted-foreground">Monitor API calls and troubleshoot authorization issues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDiagnostics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Client Logs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="client">Client Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="server">Server Logs ({serverLogs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Client-Side Diagnostic Logs
              </CardTitle>
              <CardDescription>
                Real-time logs from browser API calls with detailed error information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No client logs recorded yet. API calls will appear here automatically.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <LogCard key={index} log={log} />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Server-Side Diagnostic Logs
              </CardTitle>
              <CardDescription>
                Persistent logs stored in Supabase for historical analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {serverLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No server logs found. Check back after making some API calls.
                  </div>
                ) : (
                  serverLogs.map((log, index) => (
                    <LogCard key={index} log={log} isServer />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};