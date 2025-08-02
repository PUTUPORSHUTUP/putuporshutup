import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Clock, DollarSign, Crown, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TournamentPayment } from "./TournamentPayment";

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
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
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
      // Check user profile and premium status
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance, is_premium')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Check premium requirement for $10+ tournaments
      const entryFee = tournament.entry_fee || 0;
      if (entryFee >= 10 && !profile.is_premium) {
        throw new Error('Premium membership required for tournaments with $10+ entry fees');
      }

      // Check wallet balance - if insufficient, offer manual payment
      if (profile.wallet_balance < entryFee) {
        setUserProfile(profile);
        setShowPaymentOptions(true);
        return;
      }

      // Register for tournament
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          team_name: teamName || null,
          stake_paid: entryFee,
          payment_status: 'completed'
        });

      if (error) throw error;

      // Update user wallet balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance - entryFee 
        })
        .eq('user_id', user.id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
      }

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

      // Update tournament participant count
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          current_participants: Math.max(tournament.current_participants - 1, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id);

      if (updateError) {
        console.error('Error updating tournament participant count:', updateError);
      }

      // Refund the entry fee to user's wallet if there was one
      if (tournament.entry_fee > 0) {
        const { error: refundError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            amount: tournament.entry_fee,
            type: 'withdrawal',
            status: 'completed',
            description: `Tournament registration refund: ${tournament.title}`
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
    if (tournament.status === 'cancelled') {
      return <Badge variant="destructive">CANCELLED</Badge>;
    }
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

        
        {/* Premium Requirement Notice for $10+ tournaments */}
        {(tournament.entry_fee || 0) >= 10 && (
          <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                Premium Tournament
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This tournament requires a Premium membership to participate. 
              Entry fee $10+ tournaments are exclusive to Premium members.
            </p>
          </div>
        )}

        {/* Manual Payment Option */}
        {showPaymentOptions && userProfile && (
          <div className="space-y-4">
            <div className="p-4 border border-orange-500 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-800 dark:text-orange-200">
                  Insufficient Wallet Balance
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                Your wallet balance: ${userProfile.wallet_balance.toFixed(2)} | Entry fee: ${tournament.entry_fee}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowPaymentOptions(false)}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => window.open('/profile', '_blank')}
                  size="sm"
                  variant="secondary"
                >
                  Add Funds to Wallet
                </Button>
              </div>
            </div>
            
            <TournamentPayment 
              tournament={tournament}
              onPaymentComplete={() => {
                setShowPaymentOptions(false);
                toast({
                  title: "Payment Request Submitted",
                  description: "Your tournament entry payment is being processed. You'll be notified when verified.",
                });
              }}
            />
          </div>
        )}

        {/* Registration Form */}
        {!isUserRegistered && !registrationClosed && spotsRemaining > 0 && user && !showPaymentOptions && tournament.status !== 'cancelled' && (
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
        {tournament.status === 'cancelled' && (
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
              This tournament has been cancelled. All entry fees have been refunded.
            </p>
          </div>
        )}

        {!user && tournament.status !== 'cancelled' && (
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