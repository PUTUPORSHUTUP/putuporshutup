import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TournamentRegistrationProps {
  tournament: any;
  registrations: any[];
  onRegistrationUpdate: () => void;
}

export const TournamentRegistration = ({ 
  tournament, 
  registrations, 
  onRegistrationUpdate 
}: TournamentRegistrationProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [teamName, setTeamName] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const isUserRegistered = registrations.some(reg => reg.user_id === user?.id);
  const userRegistration = registrations.find(reg => reg.user_id === user?.id);
  const spotsRemaining = tournament.max_participants - tournament.current_participants;
  const registrationClosed = new Date() > new Date(tournament.registration_closes_at);
  const tournamentStarted = tournament.status === 'in_progress' || tournament.status === 'completed';
  const canUnregister = isUserRegistered && !tournamentStarted && !registrationClosed;

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for tournaments.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          team_name: teamName || null,
          stake_paid: tournament.entry_fee || 0,
          payment_status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: `You're now registered for ${tournament.title}`,
      });

      onRegistrationUpdate();
      setTeamName("");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user || !userRegistration) {
      toast({
        title: "Error",
        description: "Unable to find your registration.",
        variant: "destructive",
      });
      return;
    }

    setIsUnregistering(true);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', userRegistration.id);

      if (error) throw error;

      // Refund the entry fee to user's wallet if there was one
      if (tournament.entry_fee > 0) {
        const { error: refundError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount: tournament.entry_fee,
            type: 'refund',
            status: 'completed',
            description: `Tournament registration refund: ${tournament.title}`,
            metadata: {
              tournament_id: tournament.id,
              original_entry_fee: tournament.entry_fee
            }
          });

        if (refundError) {
          console.error('Error processing refund:', refundError);
        } else {
          // Update user's wallet balance using the new function
          const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
            user_id_param: user.id,
            amount_param: tournament.entry_fee
          });

          if (walletError) {
            console.error('Error updating wallet balance:', walletError);
          }
        }
      }

      toast({
        title: "Unregistered Successfully",
        description: `You've been removed from ${tournament.title}${tournament.entry_fee > 0 ? '. Entry fee has been refunded.' : '.'}`,
      });

      onRegistrationUpdate();
    } catch (error: any) {
      toast({
        title: "Unregistration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUnregistering(false);
    }
  };

  const getStatusBadge = () => {
    if (tournamentStarted) {
      return <Badge variant="destructive">Tournament Started</Badge>;
    }
    if (registrationClosed) {
      return <Badge variant="destructive">Registration Closed</Badge>;
    }
    if (spotsRemaining <= 0) {
      return <Badge variant="destructive">Tournament Full</Badge>;
    }
    if (isUserRegistered) {
      return <Badge variant="default">Registered ✓</Badge>;
    }
    return <Badge variant="secondary">Open Registration</Badge>;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Registration
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tournament Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{tournament.current_participants}/{tournament.max_participants}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">${tournament.entry_fee || 'Free'}</p>
              <p className="text-xs text-muted-foreground">Entry Fee</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">${tournament.prize_pool || 'TBD'}</p>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{spotsRemaining}</p>
              <p className="text-xs text-muted-foreground">Spots Left</p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        {!isUserRegistered && !registrationClosed && spotsRemaining > 0 && user && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name (Optional)</Label>
              <Input
                id="teamName"
                placeholder="Enter your team name..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleRegister} 
              disabled={isRegistering}
              className="w-full"
            >
              {isRegistering ? "Registering..." : `Register for $${tournament.entry_fee || 0}`}
            </Button>
          </div>
        )}

        {/* Unregister Option */}
        {isUserRegistered && canUnregister && (
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  You're registered for this tournament
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {userRegistration?.team_name && `Team: ${userRegistration.team_name}`}
                </p>
              </div>
              <Button 
                onClick={handleUnregister} 
                disabled={isUnregistering}
                variant="destructive"
                size="sm"
              >
                {isUnregistering ? "Unregistering..." : "Back Out"}
              </Button>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              You can back out of this tournament until registration closes or the tournament starts.
              {tournament.entry_fee > 0 && ` Your $${tournament.entry_fee} entry fee will be refunded.`}
            </p>
          </div>
        )}

        {/* Registered Players List */}
        {registrations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Registered Players ({registrations.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {registrations.map((registration, index) => (
                <div key={registration.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm">Player {registration.user_id.slice(0, 8)}...</span>
                    {registration.team_name && (
                      <Badge variant="outline" className="text-xs">
                        {registration.team_name}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {registration.payment_status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!user && (
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Please sign in to register for tournaments
            </p>
          </div>
        )}

        {isUserRegistered && !canUnregister && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              {tournamentStarted 
                ? "Tournament has started! Good luck!" 
                : "You're registered! Tournament details will be sent when it begins."
              }
            </p>
          </div>
        )}

        {isUserRegistered && canUnregister && (
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You're registered! You can back out using the button above until the tournament starts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};