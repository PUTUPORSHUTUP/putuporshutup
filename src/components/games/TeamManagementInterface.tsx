import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Crown, UserX, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  stake_paid: number;
  status: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface Team {
  id: string;
  team_name: string;
  captain_id: string;
  total_stake: number;
  members?: TeamMember[];
}

interface TeamManagementInterfaceProps {
  wagerId: string;
  currentUserId: string;
  teams: Team[];
  onTeamsUpdate: () => void;
}

export const TeamManagementInterface = ({ wagerId, currentUserId, teams, onTeamsUpdate }: TeamManagementInterfaceProps) => {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentUserTeam = teams.find(team => 
    team.captain_id === currentUserId || 
    team.members?.some(member => member.user_id === currentUserId)
  );

  const isCaptain = currentUserTeam?.captain_id === currentUserId;

  const handleInvitePlayer = async () => {
    if (!inviteEmail || !currentUserTeam) return;

    setLoading(true);
    try {
      // TODO: Implement team invitation logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Invitation Sent",
        description: `Team invitation sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: "Could not send team invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isCaptain || !currentUserTeam) return;

    try {
      const { error } = await supabase
        .from('challenge_team_members')
        .update({ status: 'removed' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed from the team.",
      });

      onTeamsUpdate();
    } catch (error) {
      toast({
        title: "Failed to Remove Member",
        description: "Could not remove team member. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!currentUserTeam) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">You are not part of any team for this wager.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {currentUserTeam.team_name}
          </div>
          {isCaptain && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Player to Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Player Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="player@example.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleInvitePlayer} disabled={loading || !inviteEmail} className="flex-1">
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Team Stake:</span>
          <Badge variant="outline">${currentUserTeam.total_stake}</Badge>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Team Members</h4>
          
          {currentUserTeam.members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.profile?.avatar_url} />
                  <AvatarFallback>
                    {member.profile?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {member.profile?.display_name || 'Unknown'}
                    </span>
                    {member.user_id === currentUserTeam.captain_id && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{member.profile?.username || 'unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ${member.stake_paid}
                </Badge>
                {isCaptain && member.user_id !== currentUserId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isCaptain && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              As team captain, you can invite players and manage the team roster.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};