import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Clock, 
  GamepadIcon,
  Loader2,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  status: string;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  game_mode: string;
  platform: string;
  automation_enabled: boolean;
  created_at: string;
}

export const TournamentEngine = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
    
    // Set up real-time subscription for tournament updates
    const channel = supabase
      .channel('tournament-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        () => {
          loadTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['upcoming', 'registration_open', 'ongoing'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast({
        title: "Loading Failed",
        description: "Unable to load tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: string, entryFee: number) => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join tournaments",
        variant: "destructive"
      });
      return;
    }

    if (profile.wallet_balance < entryFee) {
      toast({
        title: "Insufficient Funds",
        description: `You need $${entryFee.toFixed(2)} to join this tournament`,
        variant: "destructive"
      });
      return;
    }

    setJoinLoading(tournamentId);
    try {
      // Use the database function to join tournament
      const { data, error } = await supabase
        .rpc('join_tournament', {
          tournament_uuid: tournamentId,
          user_uuid: user.id
        });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Tournament Joined!",
          description: `Entry fee of $${entryFee} deducted. Good luck!`,
        });
        loadTournaments(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to join tournament');
      }
    } catch (error: any) {
      toast({
        title: "Join Failed",
        description: error.message || "Unable to join tournament",
        variant: "destructive"
      });
    } finally {
      setJoinLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'registration_open':
        return <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>;
      case 'ongoing':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Live</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeRemaining = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Live Tournaments</h2>
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-muted-foreground">
          Automated tournaments running 24/7. Join now and compete for prizes!
        </p>
      </div>

      {/* Tournament Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading tournaments...</span>
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <GamepadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Tournaments</h3>
            <p className="text-muted-foreground">
              New tournaments are created automatically every few minutes. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {tournament.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {tournament.description || tournament.game_mode}
                    </p>
                  </div>
                  {getStatusBadge(tournament.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Tournament Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">${tournament.entry_fee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">${tournament.prize_pool.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GamepadIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">{tournament.platform}</span>
                  </div>
                </div>

                {/* Timing Info */}
                {tournament.status === 'upcoming' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Starts: {formatTimeRemaining(tournament.registration_start)}</span>
                  </div>
                )}
                
                {tournament.status === 'registration_open' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Registration closes: {formatTimeRemaining(tournament.registration_end)}</span>
                  </div>
                )}

                {tournament.status === 'ongoing' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">Tournament in progress!</span>
                  </div>
                )}

                {/* Action Button */}
                {tournament.status === 'registration_open' && (
                  <Button 
                    className="w-full" 
                    onClick={() => joinTournament(tournament.id, tournament.entry_fee)}
                    disabled={joinLoading === tournament.id || !user}
                  >
                    {joinLoading === tournament.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trophy className="w-4 h-4 mr-2" />
                    )}
                    {!user ? 'Sign In to Join' : `Join for $${tournament.entry_fee}`}
                  </Button>
                )}

                {tournament.status === 'upcoming' && (
                  <Button variant="outline" className="w-full" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Registration Opens Soon
                  </Button>
                )}

                {tournament.status === 'ongoing' && (
                  <Button variant="secondary" className="w-full" disabled>
                    <Target className="w-4 h-4 mr-2" />
                    In Progress
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Automation Status */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-medium">🤖 PUOSU Automation Engine Active</p>
              <p className="text-sm text-muted-foreground">
                Tournaments are created and managed automatically 24/7. 
                New tournaments start every 30 minutes with automated prize distribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};