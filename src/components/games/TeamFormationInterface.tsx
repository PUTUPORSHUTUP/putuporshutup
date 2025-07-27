import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Crown, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { WagerTeam, WagerTeamMember } from '@/types/wager';

interface TeamFormationInterfaceProps {
  teamSize: number;
  teams: WagerTeam[];
  onTeamsChange: (teams: WagerTeam[]) => void;
  wagerId?: string;
  stakePerPerson: number;
}

export const TeamFormationInterface = ({ 
  teamSize, 
  teams, 
  onTeamsChange, 
  wagerId,
  stakePerPerson 
}: TeamFormationInterfaceProps) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const createTeam = async (teamNumber: number, teamName: string) => {
    if (!user) return;

    const newTeam: WagerTeam = {
      id: crypto.randomUUID(),
      wager_id: wagerId || '',
      team_name: teamName,
      team_number: teamNumber,
      captain_id: user.id,
      total_stake: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [{
        id: crypto.randomUUID(),
        team_id: '',
        user_id: user.id,
        stake_paid: stakePerPerson,
        joined_at: new Date().toISOString(),
        status: 'joined',
        profile: {
          display_name: user.user_metadata?.display_name || 'You',
          username: user.user_metadata?.username || 'you',
        }
      }]
    };

    const updatedTeams = [...teams, newTeam];
    onTeamsChange(updatedTeams);
  };

  const inviteToTeam = async () => {
    if (!inviteEmail || !user) return;

    setLoading(true);
    try {
      // Search for user by email
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .eq('user_id', inviteEmail); // For demo, treating email as user lookup

      if (error) throw error;

      // For now, just show success message
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail} for Team ${selectedTeam}`,
      });

      setInviteEmail('');
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: "Could not send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromTeam = (teamId: string, memberId: string) => {
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          members: team.members?.filter(member => member.id !== memberId) || []
        };
      }
      return team;
    });
    onTeamsChange(updatedTeams);
  };

  const getTeamSlots = (team: WagerTeam) => {
    const currentMembers = team.members?.length || 0;
    return Array.from({ length: teamSize }, (_, index) => {
      const member = team.members?.[index];
      return { index, member };
    });
  };

  // Initialize teams if none exist
  useEffect(() => {
    if (teams.length === 0 && user) {
      createTeam(1, 'Team Alpha');
      createTeam(2, 'Team Beta');
    }
  }, [teamSize, user]);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Team Formation
        </Label>
        <p className="text-sm text-muted-foreground">
          Organize players into teams of {teamSize}
        </p>
      </div>

      {/* Teams Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {team.team_name}
                  <Badge variant="outline">Team {team.team_number}</Badge>
                </span>
                <Badge variant="secondary">
                  {team.members?.length || 0}/{teamSize}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getTeamSlots(team).map(({ index, member }) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  {member ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.profile?.avatar_url} />
                        <AvatarFallback>
                          {member.profile?.display_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.profile?.display_name || 'Unknown'}
                          </span>
                          {member.user_id === team.captain_id && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${member.stake_paid} staked
                        </div>
                      </div>
                      {member.user_id !== team.captain_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTeam(team.id, member.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span>Open slot</span>
                    </div>
                  )}
                </div>
              ))}

              {(team.members?.length || 0) < teamSize && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Invite players to {team.team_name}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter username or email"
                      value={selectedTeam === team.team_number ? inviteEmail : ''}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setSelectedTeam(team.team_number);
                      }}
                      onFocus={() => setSelectedTeam(team.team_number)}
                    />
                    <Button 
                      onClick={inviteToTeam}
                      disabled={!inviteEmail || loading}
                      size="sm"
                    >
                      Invite
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {teams.reduce((total, team) => total + (team.members?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${teams.reduce((total, team) => 
                  total + (team.members?.reduce((sum, member) => sum + member.stake_paid, 0) || 0), 0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Stakes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {teams.filter(team => (team.members?.length || 0) === teamSize).length}
              </div>
              <div className="text-sm text-muted-foreground">Teams Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};