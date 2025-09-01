import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Monitor, 
  Users, 
  Clock, 
  Gamepad2, 
  RefreshCw,
  Play,
  Activity,
  Wifi
} from 'lucide-react';

interface LobbySession {
  id: string;
  lobby_id: string;
  game_id: string;
  platform: string;
  max_participants: number;
  current_participants?: number;
  status: string;
  session_start: string;
  session_end?: string;
  created_by: string;
  created_at?: string;
}

interface MonitoringStats {
  totalLobbies: number;
  healthyLobbies: number;
  restartedLobbies: number;
  uptime: string;
}

export const XboxLobbyMonitor = () => {
  const [activeLobbies, setActiveLobbies] = useState<LobbySession[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats>({
    totalLobbies: 0,
    healthyLobbies: 0,
    restartedLobbies: 0,
    uptime: "0%"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  // Fetch active lobbies
  const fetchActiveLobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('lobby_sessions')
        .select('*')
        .eq('platform', 'Xbox')
        .in('status', ['active', 'waiting', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActiveLobbies(data || []);
    } catch (error) {
      console.error('Error fetching lobbies:', error);
    }
  };

  // Create new lobby
  const createLobby = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('xbox-lobby-automation', {
        body: {
          action: 'create_lobby',
          config: {
            gameId: 'cod_bo6',
            lobbyType: '1v1',
            maxPlayers: 2,
            entryFee: 10
          }
        }
      });

      if (error) throw error;

      toast({
        title: "🎮 Xbox Lobby Created",
        description: `Lobby ${data.lobbyId} is ready for players`,
      });

      fetchActiveLobbies();
    } catch (error) {
      toast({
        title: "Failed to Create Lobby",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Monitor lobby health
  const monitorLobbies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('xbox-lobby-automation', {
        body: { action: 'monitor_lobbies' }
      });

      if (error) throw error;

      setMonitoringStats(data.monitoring);
      fetchActiveLobbies();

      toast({
        title: "Lobby Health Check Complete",
        description: `${data.monitoring.healthyLobbies} healthy, ${data.monitoring.restartedLobbies} restarted`,
      });
    } catch (error) {
      toast({
        title: "Monitoring Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchActiveLobbies();
    const interval = setInterval(fetchActiveLobbies, 10000);
    return () => clearInterval(interval);
  }, []);

  // Start real-time monitoring
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(monitorLobbies, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'waiting': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getGameIcon = (gameId: string) => {
    return <Gamepad2 className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Xbox Lobby Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time Xbox Series X lobby tracking and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            <Activity className="w-3 h-3 mr-1" />
            {isMonitoring ? "Monitoring" : "Idle"}
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button 
          onClick={createLobby} 
          disabled={isLoading}
          className="h-16 bg-green-600 hover:bg-green-700"
        >
          <Play className="w-5 h-5 mr-2" />
          {isLoading ? "Creating..." : "Create Lobby"}
        </Button>
        
        <Button 
          onClick={monitorLobbies}
          variant="outline"
          className="h-16"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Health Check
        </Button>
        
        <Button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? "destructive" : "default"}
          className="h-16"
        >
          <Activity className="w-5 h-5 mr-2" />
          {isMonitoring ? "Stop Monitor" : "Start Monitor"}
        </Button>
        
        <Button 
          onClick={fetchActiveLobbies}
          variant="outline"
          className="h-16"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Lobbies</p>
                <p className="text-2xl font-bold">{monitoringStats.totalLobbies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold">{monitoringStats.healthyLobbies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Restarted</p>
                <p className="text-2xl font-bold">{monitoringStats.restartedLobbies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">{monitoringStats.uptime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Lobbies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Active Xbox Lobbies ({activeLobbies.length})
          </CardTitle>
          <CardDescription>
            Real-time view of all active Xbox Series X lobbies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLobbies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active lobbies found</p>
              <p className="text-sm">Create a lobby to see it appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getGameIcon(lobby.game_id)}
                      <div>
                        <p className="font-medium">{lobby.lobby_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Game: {lobby.game_id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{lobby.current_participants || 0}/{lobby.max_participants}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(lobby.created_at || lobby.session_start).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    <Badge variant={getStatusColor(lobby.status)}>
                      {lobby.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};