import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGamePresence } from '@/hooks/useGamePresence';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GamepadIcon, RefreshCw, Users, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveGameStatusProps {
  showAllUsers?: boolean;
  maxUsers?: number;
}

export const LiveGameStatus = ({ showAllUsers = false, maxUsers = 10 }: LiveGameStatusProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { userPresence, allPresence, isLoading, error, refreshPresence } = useGamePresence();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger the live game tracker
      const { error } = await supabase.functions.invoke('live-game-tracker');
      if (error) throw error;
      
      // Wait a moment then refresh local data
      setTimeout(async () => {
        await refreshPresence();
        setIsRefreshing(false);
        toast({
          title: "Status Updated",
          description: "Game activity tracking refreshed"
        });
      }, 2000);
    } catch (err) {
      console.error('Error refreshing game status:', err);
      setIsRefreshing(false);
      toast({
        title: "Refresh Failed",
        description: "Could not update activity tracker",
        variant: "destructive"
      });
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'More than a day ago';
  };

  const getStatusColor = (activityState: string) => {
    switch (activityState) {
      case 'playing': return 'bg-green-500';
      case 'online': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (presence: typeof userPresence) => {
    if (!presence || !presence.is_online) return 'Offline';
    if (presence.current_game) return `Playing ${presence.current_game}`;
    if (presence.activity_state === 'online') return 'Online';
    return 'Active';
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load game status</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User's own status card
  const userStatusCard = user && (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <GamepadIcon className="w-4 h-4 mr-2" />
          Your Gaming Status
        </CardTitle>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Circle 
              className={`w-3 h-3 ${getStatusColor(userPresence?.activity_state || 'offline')}`}
              fill="currentColor"
            />
            <div>
              <p className="font-medium">{getStatusText(userPresence)}</p>
              {userPresence && (
                <p className="text-sm text-muted-foreground">
                  Last seen: {formatLastSeen(userPresence.last_seen_at)}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // All users status (if enabled)
  const allUsersCard = showAllUsers && (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Live Gaming Activity ({allPresence.length} online)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-2 animate-pulse">
                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                <div className="h-4 bg-gray-300 rounded flex-1" />
              </div>
            ))}
          </div>
        ) : allPresence.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one is currently gaming</p>
        ) : (
          <div className="space-y-3">
            {allPresence.slice(0, maxUsers).map((presence) => (
              <div key={presence.user_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Circle 
                    className={`w-2 h-2 ${getStatusColor(presence.activity_state)}`}
                    fill="currentColor"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {presence.display_name || presence.xbox_gamertag || 'Unknown Player'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {presence.current_game || 'Online'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatLastSeen(presence.last_seen_at)}
                </Badge>
              </div>
            ))}
            {allPresence.length > maxUsers && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{allPresence.length - maxUsers} more online
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {userStatusCard}
      {allUsersCard}
    </div>
  );
};