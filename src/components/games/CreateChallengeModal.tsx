import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useResponsibleGambling } from '@/hooks/useResponsibleGambling';
import { ResponsibleGamblingWarning } from './ResponsibleGamblingWarning';
import { ShareButton } from '@/components/ui/share-button';
import { Loader2, DollarSign, UserPlus } from 'lucide-react';
import { ChallengeTypeSelector } from './ChallengeTypeSelector';
import { PopularChallengeSelector } from './PopularChallengeSelector';
import { StatCriteriaBuilder } from './StatCriteriaBuilder';
import { TeamFormationInterface } from './TeamFormationInterface';
import { LobbyLinkingSystem } from './LobbyLinkingSystem';
import { LobbyStatChallengeConfig } from './LobbyStatChallengeConfig';
import { ChallengeType, VerificationMethod, StatCriteria, ChallengeTeam } from '@/types/wager';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
}

interface CreateChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGame: Game | null;
  onChallengeCreated: () => void;
}

export const CreateChallengeModal = ({ 
  open, 
  onOpenChange, 
  selectedGame, 
  onChallengeCreated 
}: CreateChallengeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState({
    gameId: '',
    title: '',
    description: '',
    stakeAmount: '',
    maxParticipants: '2',
    platform: '',
    gameMode: ''
  });

  // Enhanced challenge state
  const [challengeType, setChallengeType] = useState<ChallengeType>('1v1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [teamSize, setTeamSize] = useState(2);
  const [lobbyId, setLobbyId] = useState('');
  const [statCriteria, setStatCriteria] = useState<StatCriteria[]>([]);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('manual');
  const [teams, setTeams] = useState<ChallengeTeam[]>([]);
  const [teamPreference, setTeamPreference] = useState<'same' | 'opposite' | 'any'>('any');

  const { user } = useAuth();
  const { toast } = useToast();
  const { isExcluded, exclusionMessage, checkLimit } = useResponsibleGambling();

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      setForm(prev => ({
        ...prev,
        gameId: selectedGame.id,
        platform: selectedGame.platform[0] || ''
      }));
    }
  }, [selectedGame]);

  const loadGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    setGames(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check if user is excluded
    if (isExcluded) {
      toast({
        title: "Account Restricted",
        description: exclusionMessage || "You are currently excluded from wagering activities.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate stake amount
      const stakeAmount = parseFloat(form.stakeAmount);
      if (stakeAmount <= 0) {
        toast({
          title: "Invalid stake amount",
          description: "Stake amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check daily wager limit
      if (!checkLimit('daily_wager', stakeAmount)) {
        toast({
          title: "Daily Challenge Limit Exceeded",
          description: "This challenge exceeds your daily challenge limit.",
          variant: "destructive",
        });
        return;
      }

      // Check user's wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < stakeAmount) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough funds to create this challenge.",
          variant: "destructive",
        });
        return;
      }

      // Create the challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          game_id: form.gameId,
          title: form.title,
          description: form.description,
          stake_amount: stakeAmount,
          max_participants: parseInt(form.maxParticipants),
          platform: form.platform,
          game_mode: form.gameMode,
          total_pot: stakeAmount,
          // Enhanced fields
          challenge_type: challengeType,
          team_size: challengeType === 'team_vs_team' ? teamSize : null,
          lobby_id: challengeType === 'lobby_competition' ? lobbyId : null,
          stat_criteria: statCriteria.length > 0 ? JSON.stringify(statCriteria) : null,
          verification_method: verificationMethod
        })
        .select()
        .single();

      if (challengeError) {
        toast({
          title: "Error creating challenge",
          description: challengeError.message,
          variant: "destructive",
        });
        return;
      }

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          stake_paid: stakeAmount
        });

      if (participantError) {
        console.error('Error adding creator as participant:', participantError);
      }

      // Update user's wallet balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance - stakeAmount 
        })
        .eq('user_id', user.id);

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
      }

      // Reset form
      setForm({
        gameId: '',
        title: '',
        description: '',
        stakeAmount: '',
        maxParticipants: '2',
        platform: '',
        gameMode: ''
      });

      // Reset enhanced fields
      setChallengeType('1v1');
      setShowAdvanced(false);
      setTeamSize(2);
      setLobbyId('');
      setStatCriteria([]);
      setVerificationMethod('manual');
      setTeams([]);
      setTeamPreference('any');

      onChallengeCreated();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedGameData = games.find(g => g.id === form.gameId) || selectedGame;

  const handleTypeChange = (type: ChallengeType | 'custom') => {
    if (type === 'custom') {
      setShowAdvanced(true);
      setChallengeType('1v1');
    } else {
      setChallengeType(type);
      setShowAdvanced(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-gaming text-xl">CREATE NEW CHALLENGE</DialogTitle>
        </DialogHeader>

        <ResponsibleGamblingWarning 
          isExcluded={isExcluded} 
          exclusionMessage={exclusionMessage}
        />

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Challenge Type Selection */}
            {!showAdvanced ? (
              <PopularChallengeSelector 
                selectedType={challengeType}
                onTypeChange={handleTypeChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">Advanced Configuration</Label>
                    <p className="text-sm text-muted-foreground">Custom challenge setup with all options</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAdvanced(false)}
                  >
                    Back to Popular Types
                  </Button>
                </div>
                
                <ChallengeTypeSelector 
                  selectedType={challengeType}
                  onTypeChange={setChallengeType}
                />
              </div>
            )}

            {/* Step 2: Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game & Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="game">Game</Label>
                    <Select value={form.gameId} onValueChange={(value) => setForm(prev => ({ ...prev, gameId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                      <SelectContent>
                        {games.map((game) => (
                          <SelectItem key={game.id} value={game.id}>
                            {game.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={form.platform} onValueChange={(value) => setForm(prev => ({ ...prev, platform: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGameData?.platform.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Challenge Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Challenge Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., 1v1 Madden Championship"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add any specific rules or requirements..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stake">Stake Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="stake"
                        type="number"
                        step="0.01"
                        min="1"
                        value={form.stakeAmount}
                        onChange={(e) => setForm(prev => ({ ...prev, stakeAmount: e.target.value }))}
                        className="pl-9"
                        placeholder="25.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="participants">Max Players</Label>
                    <Select value={form.maxParticipants} onValueChange={(value) => setForm(prev => ({ ...prev, maxParticipants: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Players</SelectItem>
                        <SelectItem value="4">4 Players</SelectItem>
                        <SelectItem value="8">8 Players</SelectItem>
                        <SelectItem value="12">12 Players (6v6)</SelectItem>
                        <SelectItem value="16">16 Players</SelectItem>
                        <SelectItem value="20">20 Players (10v10)</SelectItem>
                        <SelectItem value="24">24 Players</SelectItem>
                        <SelectItem value="32">32 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mode">Game Mode</Label>
                    <Select value={form.gameMode} onValueChange={(value) => setForm(prev => ({ ...prev, gameMode: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1v1">1v1</SelectItem>
                        <SelectItem value="Best of 3">Best of 3</SelectItem>
                        <SelectItem value="Tournament">Tournament</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Challenge Type Specific Configuration */}
            {(challengeType === 'team_vs_team' || challengeType === '1v1_lobby' || 
              challengeType === 'lobby_competition' || challengeType === 'stat_based') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {challengeType === 'team_vs_team' && 'Team Configuration'}
                    {challengeType === '1v1_lobby' && 'Lobby Challenge Setup'}
                    {challengeType === 'lobby_competition' && 'Lobby Competition Setup'}
                    {challengeType === 'stat_based' && 'Stat Challenge Configuration'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {challengeType === 'team_vs_team' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="teamSize">Team Size</Label>
                        <Select value={teamSize.toString()} onValueChange={(value) => setTeamSize(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6].map(size => (
                              <SelectItem key={size} value={size.toString()}>
                                {size} players per team
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <TeamFormationInterface
                        teamSize={teamSize}
                        teams={teams}
                        onTeamsChange={setTeams}
                        stakePerPerson={parseFloat(form.stakeAmount) || 0}
                      />
                    </div>
                  )}

                  {challengeType === '1v1_lobby' && (
                    <LobbyStatChallengeConfig
                      lobbyId={lobbyId}
                      onLobbyIdChange={setLobbyId}
                      statCriteria={statCriteria}
                      onStatCriteriaChange={setStatCriteria}
                      teamPreference={teamPreference}
                      onTeamPreferenceChange={setTeamPreference}
                    />
                  )}

                  {challengeType === 'lobby_competition' && (
                    <LobbyLinkingSystem
                      lobbyId={lobbyId}
                      onLobbyIdChange={setLobbyId}
                      gameId={form.gameId}
                      platform={form.platform}
                      maxParticipants={parseInt(form.maxParticipants)}
                    />
                  )}

                  {challengeType === 'stat_based' && (
                    <StatCriteriaBuilder
                      criteria={statCriteria}
                      onCriteriaChange={setStatCriteria}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 5: Verification & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verification">Result Verification</Label>
                  <Select value={verificationMethod} onValueChange={(value: VerificationMethod) => setVerificationMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Reporting (Winner/Loser Confirmation)</SelectItem>
                      <SelectItem value="screenshot">Screenshot Proof</SelectItem>
                      <SelectItem value="video">Video Proof</SelectItem>
                      <SelectItem value="api">API Integration (if available)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Invite Players:</span>
                  <ShareButton 
                    variant="outline" 
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t pt-4 mt-4">
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Challenge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};