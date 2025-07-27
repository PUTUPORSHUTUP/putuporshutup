import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, CheckCircle, Users, Clock, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LobbyParticipant {
  id: string;
  user_id: string;
  joined_at: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface LobbySession {
  id: string;
  lobby_id: string;
  status: string;
  session_start: string;
  session_end?: string;
  max_participants: number;
  created_by: string;
  participants: LobbyParticipant[];
}

interface LobbyManagementInterfaceProps {
  wagerId: string;
  lobbyId: string;
  currentUserId: string;
}

export const LobbyManagementInterface = ({ wagerId, lobbyId, currentUserId }: LobbyManagementInterfaceProps) => {
  const [lobbySession, setLobbySession] = useState<LobbySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLobbySession();
    
    // Set up real-time subscription for lobby changes
    const channel = supabase
      .channel(`lobby_${lobbyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lobby_participants',
        filter: `lobby_session_id=eq.${lobbySession?.id}`
      }, () => {
        loadLobbySession();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const loadLobbySession = async () => {
    try {
      const { data, error } = await supabase
        .from('lobby_sessions')
        .select(`
          *,
          participants:lobby_participants(
            *,
            profile:profiles(display_name, username, avatar_url)
          )
        `)
        .eq('lobby_id', lobbyId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error loading lobby session:', error);
        return;
      }

      setLobbySession(data as any);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLobbyId = async () => {
    try {
      await navigator.clipboard.writeText(lobbyId);
      setCopied(true);
      toast({
        title: "Lobby ID Copied",
        description: "Share this ID with other players",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy lobby ID to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleEndSession = async () => {
    if (!lobbySession || lobbySession.created_by !== currentUserId) return;

    try {
      const { error } = await supabase
        .from('lobby_sessions')
        .update({ 
          status: 'ended',
          session_end: new Date().toISOString()
        })
        .eq('id', lobbySession.id);

      if (error) throw error;

      toast({
        title: "Lobby Session Ended",
        description: "The lobby session has been closed.",
      });

      loadLobbySession();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end lobby session.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading lobby information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!lobbySession) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No active lobby session found.</p>
        </CardContent>
      </Card>
    );
  }

  const isHost = lobbySession.created_by === currentUserId;
  const participantCount = lobbySession.participants?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lobby Session
          </div>
          <Badge variant={lobbySession.status === 'active' ? 'default' : 'secondary'}>
            {lobbySession.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lobby ID Section */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <div className="font-medium">Lobby ID: {lobbyId}</div>
            <div className="text-sm text-muted-foreground">
              Share this ID with other players
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyLobbyId}>
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold">{participantCount}/{lobbySession.max_participants}</p>
              <p className="text-muted-foreground">Players</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <div>
              <p className="font-bold">
                {new Date(lobbySession.session_start).toLocaleTimeString()}
              </p>
              <p className="text-muted-foreground">Started</p>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Connected Players</h4>
          
          {lobbySession.participants?.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarImage src={participant.profile?.avatar_url} />
                <AvatarFallback>
                  {participant.profile?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {participant.profile?.display_name || 'Unknown Player'}
                  {participant.user_id === currentUserId && ' (You)'}
                  {participant.user_id === lobbySession.created_by && ' (Host)'}
                </div>
                <div className="text-xs text-muted-foreground">
                  @{participant.profile?.username || 'unknown'} • 
                  Joined {new Date(participant.joined_at).toLocaleTimeString()}
                </div>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: lobbySession.max_participants - participantCount }).map((_, index) => (
            <div key={`empty-${index}`} className="flex items-center gap-3 p-3 border border-dashed rounded-lg opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">
                  Waiting for player...
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Host Controls */}
        {isHost && lobbySession.status === 'active' && (
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLobbyId} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Share Lobby
              </Button>
              <Button variant="destructive" onClick={handleEndSession} className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              As the host, you can manage the lobby session and end it when ready.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};