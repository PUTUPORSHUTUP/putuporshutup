import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTournamentModal } from '@/components/tournaments/CreateTournamentModal';
import { TournamentBracket } from '@/components/tournaments/TournamentBracket';
import { TournamentStats } from '@/components/tournaments/TournamentStats';
import { UpcomingTournaments } from '@/components/tournaments/UpcomingTournaments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  Gamepad2
} from 'lucide-react';

interface Tournament {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  platform: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  start_time: string | null;
  created_at: string;
  game: {
    id: string;
    display_name: string;
    name: string;
  };
}

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<any[]>([]);
  const [tournamentParticipants, setTournamentParticipants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tournaments:', error);
        return;
      }

      setTournaments(data as Tournament[] || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: string) => {
    try {
      // Load matches
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      // Load participants with profiles
      const { data: participants } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          profiles:user_id(display_name, username, avatar_url)
        `)
        .eq('tournament_id', tournamentId)
        .order('bracket_position');

      setTournamentMatches(matches || []);
      setTournamentParticipants(participants || []);
    } catch (error) {
      console.error('Error loading tournament details:', error);
    }
  };

  const handleJoinTournament = async (tournamentId: string, entryFee: number) => {
    if (!user) return;

    try {
      // Check user's wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < entryFee) {
        toast({
          title: "Insufficient Funds",
          description: `You need $${entryFee} to join this tournament.`,
          variant: "destructive",
        });
        return;
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Already Joined",
          description: "You've already joined this tournament.",
          variant: "destructive",
        });
        return;
      }

      // Get current tournament data for bracket positioning and prize pool
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('current_participants, max_participants, prize_pool')
        .eq('id', tournamentId)
        .single();

      if (!tournament || tournament.current_participants >= tournament.max_participants) {
        toast({
          title: "Tournament Full",
          description: "This tournament has reached maximum capacity.",
          variant: "destructive",
        });
        return;
      }

      // Join tournament
      const { error: joinError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          entry_paid: entryFee,
          bracket_position: tournament.current_participants + 1
        });

      if (joinError) {
        toast({
          title: "Error joining tournament",
          description: joinError.message,
          variant: "destructive",
        });
        return;
      }

      // Update tournament participant count and prize pool
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({
          current_participants: tournament.current_participants + 1,
          prize_pool: tournament.current_participants > 0 
            ? tournament.prize_pool + entryFee 
            : entryFee
        })
        .eq('id', tournamentId);

      if (updateError) {
        console.error('Error updating tournament:', updateError);
      }

      // Update user's wallet balance
      await supabase
        .from('profiles')
        .update({
          wallet_balance: profile.wallet_balance - entryFee
        })
        .eq('user_id', user.id);

      toast({
        title: "Joined Tournament!",
        description: "You've successfully joined the tournament. Good luck!",
      });

      loadTournaments();
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const generateBracket = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-tournament-bracket', {
        body: { tournamentId }
      });

      if (error) throw error;

      toast({
        title: "Bracket Generated!",
        description: `Created ${data.matchesCreated} matches across ${data.rounds} rounds.`,
      });

      loadTournaments();
      if (selectedTournament?.id === tournamentId) {
        await loadTournamentDetails(tournamentId);
      }
    } catch (error: any) {
      console.error('Error generating bracket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate bracket",
        variant: "destructive",
      });
    }
  };

  const handleViewBracket = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    await loadTournamentDetails(tournament.id);
    setActiveTab('bracket');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Gamepad2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-gaming text-primary">TOURNAMENTS</h1>
            <p className="text-muted-foreground mt-2">Compete in bracket-style competitions</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.open('/sponsor', '_blank')}
              variant="outline"
              size="lg"
              className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black"
            >
              <Trophy className="w-5 h-5 mr-2" />
              BECOME A SPONSOR
            </Button>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              CREATE TOURNAMENT
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="browse">All Tournaments</TabsTrigger>
            <TabsTrigger value="bracket">Tournament Bracket</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upcoming Tournaments</h2>
              <p className="text-muted-foreground">
                Register now for these exciting upcoming competitions
              </p>
            </div>
            <UpcomingTournaments showAll={true} />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <Card className="p-12 text-center">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Tournaments</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a tournament and start competing!
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    Create First Tournament
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {tournament.game.display_name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {tournament.platform}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(tournament.status)}`} />
                          </div>
                          <CardTitle className="text-lg leading-tight">{tournament.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Tournament Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-bold text-green-600">${tournament.entry_fee}</p>
                            <p className="text-xs text-muted-foreground">Entry Fee</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <div>
                            <p className="font-bold text-yellow-600">${tournament.prize_pool}</p>
                            <p className="text-xs text-muted-foreground">Prize Pool</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-bold">
                              {tournament.current_participants}/{tournament.max_participants}
                            </p>
                            <p className="text-xs text-muted-foreground">Players</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(tournament.status)}
                          <div>
                            <p className="font-bold capitalize">{tournament.status}</p>
                            <p className="text-xs text-muted-foreground">Status</p>
                          </div>
                        </div>
                      </div>

                      {/* Start Time */}
                      {tournament.start_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Starts: {new Date(tournament.start_time).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Description */}
                      {tournament.description && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {tournament.description}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        {tournament.status === 'open' && (
                          <Button 
                            onClick={() => handleJoinTournament(tournament.id, tournament.entry_fee)}
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={tournament.current_participants >= tournament.max_participants}
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Join for ${tournament.entry_fee}
                          </Button>
                        )}
                        
                        {/* Tournament Creator Actions */}
                        {user?.id === tournament.creator_id && tournament.status === 'open' && 
                         tournament.current_participants >= 2 && (
                          <Button 
                            onClick={() => generateBracket(tournament.id)}
                            variant="secondary"
                            className="w-full"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            Start Tournament
                          </Button>
                        )}
                        
                        {tournament.status !== 'open' && (
                          <Button 
                            onClick={() => handleViewBracket(tournament)}
                            variant="outline"
                            className="w-full"
                          >
                            View Bracket
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bracket" className="space-y-6">
            {selectedTournament ? (
              <div className="space-y-6">
                {/* Tournament Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      {selectedTournament.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{selectedTournament.game.display_name}</span>
                      <span>•</span>
                      <span>{selectedTournament.platform}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedTournament.status}</span>
                    </div>
                  </CardHeader>
                </Card>

                {/* Tournament Statistics */}
                <TournamentStats 
                  tournament={selectedTournament}
                  matches={tournamentMatches}
                  participants={tournamentParticipants}
                />

                {/* Tournament Bracket */}
                <TournamentBracket
                  matches={tournamentMatches}
                  participants={tournamentParticipants}
                  tournamentSize={selectedTournament.max_participants}
                  tournament={selectedTournament}
                  onMatchUpdate={() => loadTournamentDetails(selectedTournament.id)}
                />
              </div>
            ) : (
              <Card className="p-12 text-center">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Tournament Selected</h3>
                  <p className="text-muted-foreground">
                    Select a tournament from the browse tab to view its bracket.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateTournamentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onTournamentCreated={loadTournaments}
      />
    </div>
  );
};

export default Tournaments;