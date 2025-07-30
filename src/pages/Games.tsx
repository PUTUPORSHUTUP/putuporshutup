import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateChallengeModal } from '@/components/games/CreateChallengeModal';
import { TermsModal } from '@/components/TermsModal';
import { ChallengeCard } from '@/components/games/ChallengeCard';
import { SuggestGameModal } from '@/components/games/SuggestGameModal';

import { MatchingPreferences } from '@/components/games/MatchingPreferences';
import { QuickMatch } from '@/components/games/QuickMatch';
import { MatchNotifications } from '@/components/games/MatchNotifications';
import { ChallengeTypeFilter } from '@/components/games/ChallengeTypeFilter';
import { VerificationWorkflow } from '@/components/games/VerificationWorkflow';
import { TeamManagementInterface } from '@/components/games/TeamManagementInterface';
import { LobbyManagementInterface } from '@/components/games/LobbyManagementInterface';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trophy, DollarSign, Users, Gamepad2, Lightbulb, Settings } from 'lucide-react';
import { StatLoggingService } from '@/services/statLoggingService';
import { GameRulesConfig } from '@/components/games/GameRulesConfig';
import { GameAPIHub } from '@/components/games/GameAPIHub';
import { MatchOutcomeAutomation } from '@/components/games/MatchOutcomeAutomation';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
  image_url?: string;
  is_active: boolean;
}

interface WagerParticipant {
  user_id: string;
  stake_paid: number;
  joined_at: string;
}

interface Wager {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  stake_amount: number;
  max_participants: number;
  platform: string;
  game_mode: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  total_pot: number;
  winner_id?: string | null;
  created_at: string;
  game: Game;
  participant_count: number;
  user_participated?: boolean;
  wager_participants: WagerParticipant[];
  // Enhanced fields
  wager_type?: string;
  team_size?: number;
  lobby_id?: string;
  stat_criteria?: any;
  verification_method?: string;
}

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [filteredWagers, setFilteredWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  
  const [selectedWagerType, setSelectedWagerType] = useState('all');
  const [userBalance, setUserBalance] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWager, setSelectedWager] = useState<any>(null);

  // Check if user has accepted terms
  useEffect(() => {
    const termsAccepted = localStorage.getItem('puosu_terms_accepted');
    if (!termsAccepted && user) {
      setShowTermsModal(true);
    }
  }, [user]);

  useEffect(() => {
    loadGames();
    loadWagers();
    loadUserBalance();
    
    // Set up real-time subscriptions
    const wagerChannel = supabase
      .channel('wagers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wagers'
      }, () => {
        loadWagers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wager_participants'
      }, () => {
        loadWagers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(wagerChannel);
    };
  }, []);

  // Filter wagers by type
  useEffect(() => {
    if (selectedWagerType === 'all') {
      setFilteredWagers(wagers);
    } else {
      const filtered = wagers.filter(wager => 
        (wager.wager_type || '1v1') === selectedWagerType
      );
      setFilteredWagers(filtered);
    }
  }, [wagers, selectedWagerType]);

  // Calculate wager counts by type
  const getWagerCounts = () => {
    const counts: Record<string, number> = {
      all: wagers.length,
      '1v1': wagers.filter(w => !w.wager_type || w.wager_type === '1v1').length,
      'team_vs_team': wagers.filter(w => w.wager_type === 'team_vs_team').length,
      'lobby_competition': wagers.filter(w => w.wager_type === 'lobby_competition').length,
      'stat_based': wagers.filter(w => w.wager_type === 'stat_based').length
    };
    return counts;
  };

  const loadUserBalance = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', user.id)
      .single();
      
    setUserBalance(data?.wallet_balance || 0);
  };

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      setGames(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadWagers = async () => {
    try {
      // Get all wagers with participant data
      const { data: allWagers, error: wagersError } = await supabase
        .from('challenges')
        .select(`
          *,
          game:games(*),
          participant_count:challenge_participants(count),
          challenge_participants(user_id, stake_paid, joined_at)
        `)
        .in('status', ['open', 'in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (wagersError) {
        console.error('Error loading wagers:', wagersError);
        return;
      }

      // Then check which wagers the current user participates in
      let userParticipations: string[] = [];
      if (user) {
        const { data: participations } = await supabase
        .from('challenge_participants')
          .select('challenge_id')
          .eq('user_id', user.id);
        
        userParticipations = participations?.map(p => p.challenge_id) || [];
      }

      const wagersWithCount = (allWagers as any)?.map((wager: any) => ({
        ...wager,
        participant_count: wager.participant_count?.[0]?.count || 0,
        user_participated: userParticipations.includes(wager.id),
        status: wager.status as 'open' | 'in_progress' | 'completed' | 'cancelled',
        challenge_participants: wager.challenge_participants || []
      })) || [];

      console.log('User participations:', userParticipations);
      console.log('Wagers with participation status:', wagersWithCount);

      setWagers(wagersWithCount as Wager[]);
      setFilteredWagers(wagersWithCount as Wager[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWager = (game: Game) => {
    setSelectedGame(game);
    setCreateModalOpen(true);
  };

  const handleWagerCreated = () => {
    loadWagers();
    setCreateModalOpen(false);
    setSelectedGame(null);
    toast({
      title: "Wager Created!",
      description: "Your challenge is now live and players can join.",
    });
  };

  const handleJoinWager = async (wagerId: string, stakeAmount: number) => {
    if (!user) return;

    try {
      setJoining(wagerId);
      
      // Check user's wallet balance first
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < stakeAmount) {
        toast({
          title: "Insufficient Funds",
          description: `You need $${stakeAmount} to join this wager. Your balance: $${profile?.wallet_balance || 0}`,
          variant: "destructive",
        });
        return;
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', wagerId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Already Joined",
          description: "You've already joined this wager.",
          variant: "destructive",
        });
        return;
      }

      // Join the wager
      const { error: joinError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: wagerId,
          user_id: user.id,
          stake_paid: stakeAmount
        });

      if (joinError) {
        toast({
          title: "Error joining wager",
          description: joinError.message,
          variant: "destructive",
        });
        return;
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

      // Find the wager for stat logging
      const wager = wagers.find(w => w.id === wagerId);
      if (wager) {
        // Log challenge participation silently
        await StatLoggingService.logChallengeParticipation(
          user.id,
          wagerId,
          wager.game?.display_name || 'Unknown Game',
          wager.platform,
          stakeAmount
        );
      }

      toast({
        title: "Joined Wager!",
        description: "You've successfully joined the challenge. Good luck!",
      });

      // Refresh data
      loadWagers();
      loadUserBalance();
      
    } catch (error) {
      console.error('Error joining wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setJoining(null);
    }
  };

  const handleLeaveWager = async (wagerId: string) => {
    if (!user) return;

    try {
      setLeaving(wagerId);
      
      const { data, error } = await supabase.functions.invoke('leave-wager', {
        body: { wager_id: wagerId }
      });

      if (error) {
        toast({
          title: "Error leaving wager",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Left Wager!",
        description: data.message,
      });

      // Refresh data
      loadWagers();
      loadUserBalance();
      
    } catch (error) {
      console.error('Error leaving wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLeaving(null);
    }
  };

  // Simple game list for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header for non-authenticated users */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-orbitron font-bold text-neon-green mb-4">
              Available Games
            </h1>
            <p className="text-xl text-muted-foreground mb-8 font-orbitron">
              See what games you can compete in. Sign up to start wagering!
            </p>
          </div>

          {/* Games Grid for visitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))
            ) : (
              games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow border-2 border-neon-green/20 hover:border-neon-green/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="font-orbitron text-lg">{game.display_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm font-orbitron">{game.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {game.platform.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-center">
                      <Badge variant="secondary" className="font-orbitron">
                        {wagers.filter(w => w.game.id === game.id).length} Active Wagers
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Call to Action for non-authenticated users */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto p-8 border-2 border-neon-green/20">
              <CardContent>
                <h3 className="text-2xl font-orbitron font-bold text-neon-green mb-4">
                  Ready to Compete?
                </h3>
                <p className="text-muted-foreground mb-6 font-orbitron">
                  Join thousands of gamers putting their skills to the test. Create wagers, accept challenges, and win real money.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-neon-green text-black hover:bg-neon-green/90 font-orbitron font-semibold"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Sign Up to Play
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-orbitron font-semibold"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-gaming text-primary">GAMES & WAGERS</h1>
              <p className="text-muted-foreground mt-2">Challenge players and win big</p>
            </div>
            
            {/* Mobile-first action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-last sm:order-none">
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                CREATE WAGER
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSuggestModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Lightbulb className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">SUGGEST GAME</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Wallet Balance - Mobile optimized */}
          <Card className="sm:max-w-sm">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-full">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-lg font-bold">${userBalance.toFixed(2)}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/profile'}
              >
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{wagers.length}</p>
                <p className="text-sm text-muted-foreground">Active Wagers</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${wagers.reduce((sum, w) => sum + w.total_pot, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Pot</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {wagers.reduce((sum, w) => sum + w.participant_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Players</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Gamepad2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{games.length}</p>
                <p className="text-sm text-muted-foreground">Games Available</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 max-w-4xl text-xs">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="quick-match">Quick Match</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="api-hub">API Hub</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Wager Type Filter */}
            <ChallengeTypeFilter
              selectedType={selectedWagerType}
              onTypeChange={setSelectedWagerType}
              challengeCounts={getWagerCounts()}
            />
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredWagers.length === 0 ? (
              <Card className="p-12 text-center">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {selectedWagerType === 'all' ? 'No Active Wagers' : `No ${selectedWagerType.replace('_', ' ')} Wagers`}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedWagerType === 'all' 
                      ? 'Be the first to create a challenge and start earning!'
                      : `No ${selectedWagerType.replace('_', ' ')} wagers available right now.`
                    }
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    Create Wager
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWagers.map((wager) => (
                  <ChallengeCard 
                    key={wager.id} 
                    wager={wager} 
                    onJoin={handleJoinWager}
                    onLeave={handleLeaveWager}
                    onResultReported={loadWagers}
                    currentUserId={user?.id}
                    isJoining={joining === wager.id}
                    isLeaving={leaving === wager.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-gaming">{game.display_name}</CardTitle>
                      <Badge variant="secondary">
                        {wagers.filter(w => w.game.id === game.id).length} Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{game.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {game.platform.map((platform) => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleCreateWager(game)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Wager
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quick-match" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuickMatch 
                onMatchFound={(wagerId) => {
                  // Navigate to the wager or show success message
                  toast({
                    title: "Match Found!",
                    description: "Your wager has been created and you've been matched!",
                  });
                  loadWagers();
                  setActiveTab('browse');
                }}
              />
              <MatchingPreferences 
                onPreferencesUpdate={() => {
                  toast({
                    title: "Preferences Updated",
                    description: "Your matching preferences have been saved.",
                  });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <MatchNotifications 
              onNavigateToWager={(wagerId) => {
                // Could navigate to a specific wager view
                setActiveTab('browse');
                toast({
                  title: "Viewing Wager",
                  description: "Check the browse tab for your matched wager.",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="api-hub" className="space-y-6">
            <GameAPIHub />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <MatchOutcomeAutomation />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <GameRulesConfig />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateChallengeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedGame={selectedGame}
        onChallengeCreated={handleWagerCreated}
      />
      
      <SuggestGameModal
        open={suggestModalOpen}
        onOpenChange={setSuggestModalOpen}
      />
      

      <TermsModal
        open={showTermsModal}
        onAccept={() => setShowTermsModal(false)}
      />
    </div>
  );
};

export default Games;