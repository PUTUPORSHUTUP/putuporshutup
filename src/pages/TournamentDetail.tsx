import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Clock
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
  status: string;
  start_time: string | null;
  created_at: string;
  game: {
    id: string;
    display_name: string;
    name: string;
  };
}

export default function TournamentDetail() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      navigate("/404", { replace: true });
      return;
    }
    loadTournament();
  }, [tournamentId, navigate]);

  const loadTournament = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          game:games(id, display_name, name)
        `)
        .eq("id", tournamentId)
        .single();

      if (error || !data) {
        navigate("/404", { replace: true });
        return;
      }

      setTournament(data);

      // Check if user is registered
      if (user) {
        const { data: registration } = await supabase
          .from("tournament_registrations")
          .select("id")
          .eq("tournament_id", tournamentId)
          .eq("user_id", user.id)
          .single();
        
        setUserRegistered(!!registration);
      }
    } catch (error) {
      console.error("Error loading tournament:", error);
      navigate("/404", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!user || !tournament) return;

    setIsJoining(true);
    try {
      // Check wallet balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.wallet_balance < tournament.entry_fee) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds to join this tournament",
          variant: "destructive"
        });
        return;
      }

      // Insert registration
      const { error: regError } = await supabase
        .from("tournament_registrations")
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          entry_fee_paid: tournament.entry_fee
        });

      if (regError) throw regError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from("profiles")
        .update({ 
          wallet_balance: profile.wallet_balance - tournament.entry_fee,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      // Update tournament participant count
      const { error: tournamentError } = await supabase
        .from("tournaments")
        .update({
          current_participants: tournament.current_participants + 1,
          prize_pool: tournament.prize_pool + tournament.entry_fee
        })
        .eq("id", tournament.id);

      if (tournamentError) throw tournamentError;

      setUserRegistered(true);
      toast({
        title: "Successfully Joined!",
        description: "You've been registered for the tournament"
      });
      
      loadTournament(); // Refresh data
    } catch (error) {
      console.error("Error joining tournament:", error);
      toast({
        title: "Error",
        description: "Failed to join tournament. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg">Loading tournament...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/tournaments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tournament Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{tournament.title}</CardTitle>
                    <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                      {tournament.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Game</div>
                    <div className="font-semibold">{tournament.game.display_name}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {tournament.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{tournament.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Entry Fee</div>
                      <div className="font-semibold">${tournament.entry_fee}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Prize Pool</div>
                      <div className="font-semibold">${tournament.prize_pool}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Participants</div>
                      <div className="font-semibold">
                        {tournament.current_participants} / {tournament.max_participants}
                      </div>
                    </div>
                  </div>

                  {tournament.start_time && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Start Time</div>
                        <div className="font-semibold">
                          {new Date(tournament.start_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Platform:</div>
                  <Badge variant="outline">{tournament.platform}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tournament Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.status === 'open' && (
                  <>
                    {userRegistered ? (
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-700 font-semibold mb-2">✅ You're Registered!</div>
                        <div className="text-sm text-green-600">
                          Tournament starts {tournament.start_time ? new Date(tournament.start_time).toLocaleString() : 'soon'}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleJoinTournament}
                        disabled={!user || isJoining || tournament.current_participants >= tournament.max_participants}
                        className="w-full"
                        size="lg"
                      >
                        {isJoining ? "Joining..." : `Join for $${tournament.entry_fee}`}
                      </Button>
                    )}
                  </>
                )}

                {tournament.status === 'in_progress' && (
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-700 font-semibold">⚡ Tournament In Progress</div>
                  </div>
                )}

                {tournament.status === 'completed' && (
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-700 font-semibold">🏆 Tournament Complete</div>
                  </div>
                )}

                {!user && tournament.status === 'open' && (
                  <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-gray-700 mb-2">Sign in to join</div>
                    <Button 
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}