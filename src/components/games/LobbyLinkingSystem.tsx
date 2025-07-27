import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gamepad2, Link, Users, Copy, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { LobbySession, LobbyParticipant } from '@/types/wager';

interface LobbyLinkingSystemProps {
  lobbyId?: string;
  onLobbyIdChange: (lobbyId: string) => void;
  gameId: string;
  platform: string;
  maxParticipants: number;
}

export const LobbyLinkingSystem = ({ 
  lobbyId, 
  onLobbyIdChange, 
  gameId, 
  platform,
  maxParticipants 
}: LobbyLinkingSystemProps) => {
  const [newLobbyId, setNewLobbyId] = useState(lobbyId || '');
  const [lobbySession, setLobbySession] = useState<LobbySession | null>(null);
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLobbyId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewLobbyId(result);
    onLobbyIdChange(result);
  };

  const copyLobbyId = async () => {
    if (!newLobbyId) return;
    
    try {
      await navigator.clipboard.writeText(newLobbyId);
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

  const joinLobby = () => {
    if (!newLobbyId) return;
    
    onLobbyIdChange(newLobbyId);
    
    // Mock lobby session for demo
    setLobbySession({
      id: crypto.randomUUID(),
      lobby_id: newLobbyId,
      game_id: gameId,
      platform,
      session_start: new Date().toISOString(),
      max_participants: maxParticipants,
      created_by: 'current_user',
      status: 'active'
    });

    // Mock participants
    setParticipants([
      {
        id: crypto.randomUUID(),
        lobby_session_id: '',
        user_id: 'current_user',
        joined_at: new Date().toISOString(),
        profile: {
          display_name: 'You',
          username: 'you'
        }
      }
    ]);

    toast({
      title: "Joined Lobby",
      description: `Connected to lobby ${newLobbyId}`,
    });
  };

  const leaveLobby = () => {
    setLobbySession(null);
    setParticipants([]);
    setNewLobbyId('');
    onLobbyIdChange('');
    
    toast({
      title: "Left Lobby",
      description: "You have left the lobby session",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Link className="w-4 h-4" />
          Lobby Connection
        </Label>
        <p className="text-sm text-muted-foreground">
          Connect players in the same game lobby/match
        </p>
      </div>

      {!lobbySession ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Join or Create Lobby
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Lobby ID</Label>
              <div className="flex gap-2">
                <Input
                  value={newLobbyId}
                  onChange={(e) => setNewLobbyId(e.target.value.toUpperCase())}
                  placeholder="Enter lobby ID or generate one"
                  maxLength={8}
                />
                <Button variant="outline" onClick={generateLobbyId}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                8-character lobby identifier (e.g., ABC123XY)
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={joinLobby} 
                disabled={!newLobbyId || loading}
                className="flex-1"
              >
                {newLobbyId ? 'Join Lobby' : 'Create Lobby'}
              </Button>
              {newLobbyId && (
                <Button variant="outline" onClick={copyLobbyId}>
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Lobby {lobbySession.lobby_id}
              </div>
              <Badge variant="secondary">
                {participants.length}/{maxParticipants} Players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Lobby ID: {lobbySession.lobby_id}</div>
                <div className="text-sm text-muted-foreground">
                  Share this ID with other players
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={copyLobbyId}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div>
              <Label className="text-sm font-medium">Connected Players</Label>
              <div className="space-y-2 mt-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={participant.profile?.avatar_url} />
                      <AvatarFallback>
                        {participant.profile?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {participant.profile?.display_name || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{participant.profile?.username || 'unknown'}
                      </div>
                    </div>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: maxParticipants - participants.length }).map((_, index) => (
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
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={leaveLobby} className="flex-1">
                Leave Lobby
              </Button>
              <Button variant="outline" onClick={copyLobbyId}>
                <Copy className="w-4 h-4 mr-2" />
                Share Lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {lobbySession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lobby Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline">1</Badge>
              <div>
                <div className="font-medium">Share the Lobby ID</div>
                <div className="text-sm text-muted-foreground">
                  Send the lobby ID to all participants so they can join
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">2</Badge>
              <div>
                <div className="font-medium">Start the Game</div>
                <div className="text-sm text-muted-foreground">
                  Once everyone joins, start the match in your game
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">3</Badge>
              <div>
                <div className="font-medium">Track Performance</div>
                <div className="text-sm text-muted-foreground">
                  Monitor individual stats during the match
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">4</Badge>
              <div>
                <div className="font-medium">Submit Results</div>
                <div className="text-sm text-muted-foreground">
                  Report final stats and determine the winner
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};