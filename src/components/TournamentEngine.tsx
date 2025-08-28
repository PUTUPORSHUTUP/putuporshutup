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
  Zap,
  Plus
} from 'lucide-react';

interface Tournament {
  id: string;
  title: string;
  description: string;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  status: string;
  platform: string;
  created_at: string;
}

export const TournamentEngine = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

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
        .select(`
          id, title, description, entry_fee, max_participants, 
          current_participants, prize_pool, status, 
          platform, created_at
        `)
        .in('status', ['upcoming', 'registration_open', 'ongoing'])
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setTournaments((data || []) as Tournament[]);
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

  const createNewTournament = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create tournaments",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const tournamentName = `PUOSU Tournament ${now.toISOString().slice(0, 16).replace('T', ' ')}`;
      
      // First get a game_id from the games table
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .limit(1);

      if (gamesError || !games?.length) {
        throw new Error('No games available. Please contact administrator.');
      }
      
      const { error } = await supabase
        .from('tournaments')
        .insert({
          title: tournamentName,
          description: 'Elite gaming tournament with automated prize distribution',
          entry_fee: 25,
          max_participants: 16,
          current_participants: 0,
          prize_pool: 0,
          status: 'registration_open',
          platform: 'Xbox Series X',
          creator_id: user.id,
          game_id: games[0].id // Use the first available game
        });

      if (error) throw error;

      toast({
        title: "Tournament Created!",
        description: "Your tournament is now live and accepting registrations",
      });

      loadTournaments();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Unable to create tournament",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        
        {user && (
          <Button onClick={createNewTournament} disabled={loading} className="mt-4">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Tournament
          </Button>
        )}
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
                      {tournament.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {tournament.description || 'Elite gaming tournament'}
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

                {/* Status Info */}
                {tournament.status === 'upcoming' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Starting soon...</span>
                  </div>
                )}
                
                {tournament.status === 'registration_open' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Registration open now!</span>
                  </div>
                )}

                {tournament.status === 'ongoing' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">Tournament in progress!</span>
                  </div>
                )}

                {/* Action Buttons */}
                {tournament.status === 'registration_open' && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      disabled={!user || !profile || profile.wallet_balance < tournament.entry_fee}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {!user ? 'Sign In to Join' : 
                       !profile || profile.wallet_balance < tournament.entry_fee ? 
                       'Insufficient Funds' : 
                       `Join for $${tournament.entry_fee}`}
                    </Button>
                    {profile && profile.wallet_balance < tournament.entry_fee && (
                      <p className="text-xs text-center text-muted-foreground">
                        Need $${(tournament.entry_fee - profile.wallet_balance).toFixed(2)} more
                      </p>
                    )}
                  </div>
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