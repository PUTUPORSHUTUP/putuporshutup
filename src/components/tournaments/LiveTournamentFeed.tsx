import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Clock, DollarSign, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Tournament {
  id: string;
  title: string;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  start_time: string;
  game_mode?: string;
  status: string;
  description: string;
  created_by_automation?: boolean;
  tournament_type?: string;
}

interface EngineStatus {
  is_running: boolean;
  next_tournament_scheduled_at: string;
  tournaments_created_today: number;
  total_revenue_today: number;
}

export const LiveTournamentFeed = () => {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTournaments = async () => {
    try {
      const { data: tournaments, error } = await supabase
        .from("tournaments")
        .select(`
          id, title, entry_fee, max_participants, current_participants, 
          start_time, status, description, created_by_automation
        `)
        .eq("title", "Sunday Showdown") // Only show Sunday Showdown
        .in("status", ["open", "in_progress"])
        .order("start_time", { ascending: true })
        .limit(1);

      if (error) throw error;
      
      // Add mock game_mode for now
      const tournamentsWithMode = (tournaments || []).map((t: any) => ({
        ...t,
        game_mode: "Battle Royale" // Default game mode
      }));
      
      setActiveTournaments(tournamentsWithMode);

      // Zero out all fake numbers for live launch
      setEngineStatus({
        is_running: false,
        next_tournament_scheduled_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        tournaments_created_today: 0,
        total_revenue_today: 0
      });
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: string, entryFee: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join tournaments",
        variant: "destructive",
      });
      return;
    }

    setJoining(tournamentId);
    try {
      const { error } = await supabase
        .from("tournament_registrations")
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          entry_fee: entryFee,
        });

      if (error) throw error;

      toast({
        title: "Tournament Joined! 🎮",
        description: `You're in! Entry fee: $${entryFee}`,
      });

      fetchTournaments(); // Refresh to update participant counts
    } catch (error: any) {
      toast({
        title: "Failed to Join",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(null);
    }
  };

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return "Starting now!";
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getNextTournamentTime = () => {
    if (!engineStatus?.next_tournament_scheduled_at) return null;
    
    const now = new Date();
    const next = new Date(engineStatus.next_tournament_scheduled_at);
    const diffMs = next.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    return diffMins > 0 ? diffMins : 0;
  };

  useEffect(() => {
    fetchTournaments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel("tournament-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
        },
        () => {
          fetchTournaments();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTournaments, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg"></div>
          </Card>
        ))}
      </div>
    );
  }

  const nextTournamentMins = getNextTournamentTime();

  return (
    <div className="space-y-6">
      {/* Engine Status */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Tournament Engine Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {engineStatus?.is_running ? "🟢 LIVE" : "🔴 OFF"}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {nextTournamentMins !== null ? `${nextTournamentMins}m` : "..."}
              </div>
              <div className="text-sm text-muted-foreground">Next Tournament</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{engineStatus?.tournaments_created_today || 0}</div>
              <div className="text-sm text-muted-foreground">Today's Tournaments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${engineStatus?.total_revenue_today?.toFixed(0) || 0}</div>
              <div className="text-sm text-muted-foreground">Today's Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Tournaments */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Live Tournaments - Join Now!
        </h2>
        
        {activeTournaments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No active tournaments right now. Next one starts in {nextTournamentMins}m!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{tournament.title}</CardTitle>
                    <div className="flex gap-2 ml-2">
                      <Badge 
                        variant={tournament.status === 'cancelled' ? 'destructive' : 
                                tournament.status === 'in_progress' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {tournament.status === 'cancelled' ? 'CANCELLED' :
                         tournament.status === 'in_progress' ? 'IN PROGRESS' :
                         tournament.status === 'open' ? 'OPEN' : tournament.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tournament.game_mode}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-bold">${tournament.entry_fee}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{tournament.current_participants || 0}/{tournament.max_participants}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Starts in {getTimeUntilStart(tournament.start_time)}</span>
                  </div>

                  <Button 
                    onClick={() => joinTournament(tournament.id, tournament.entry_fee)}
                    disabled={joining === tournament.id || tournament.status !== 'open'}
                    className="w-full"
                    size="sm"
                    variant={tournament.status === 'cancelled' ? 'destructive' : 'default'}
                  >
                    {tournament.status === 'cancelled' ? 'CANCELLED' :
                     tournament.status === 'in_progress' ? 'IN PROGRESS' :
                     joining === tournament.id ? "Joining..." : `Join for $${tournament.entry_fee}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};