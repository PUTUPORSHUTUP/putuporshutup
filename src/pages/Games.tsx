import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateChallengeModal } from '@/components/games/CreateChallengeModal';
import { ComprehensiveLegalModal } from '@/components/legal/ComprehensiveLegalModal';
import { ChallengeCard } from '@/components/games/ChallengeCard';
import { SuggestGameModal } from '@/components/games/SuggestGameModal';
import { MatchingPreferences } from '@/components/games/MatchingPreferences';
import { QuickMatch } from '@/components/games/QuickMatch';
import { MatchNotifications } from '@/components/games/MatchNotifications';
import { ChallengeTypeFilter } from '@/components/games/ChallengeTypeFilter';
import { GameRulesConfig } from '@/components/games/GameRulesConfig';
import { GameAPIHub } from '@/components/games/GameAPIHub';
import { MatchOutcomeAutomation } from '@/components/games/MatchOutcomeAutomation';
import { GamesHeader } from '@/components/games/GamesHeader';
import { WalletBalanceCard } from '@/components/games/WalletBalanceCard';
import { GamesStatsCards } from '@/components/games/GamesStatsCards';
import { GamesVisitorView } from '@/components/games/GamesVisitorView';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGamesData } from '@/hooks/useGamesData';
import { useWagerActions } from '@/hooks/useWagerActions';
import { Plus, Trophy } from 'lucide-react';

const Games = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use custom hooks for data and actions
  const {
    games,
    wagers,
    filteredWagers,
    loading,
    userBalance,
    selectedWagerType,
    setSelectedWagerType,
    loadWagers,
    loadUserBalance,
    getWagerCounts
  } = useGamesData();
  
  const { joining, leaving, handleJoinWager, handleLeaveWager } = useWagerActions();

  // Check if user has accepted comprehensive legal requirements
  useEffect(() => {
    const legalAccepted = localStorage.getItem('puosu_legal_accepted');
    const legalVersion = localStorage.getItem('puosu_legal_version');
    if ((!legalAccepted || legalVersion !== '2.0') && user) {
      setShowLegalModal(true);
    }
  }, [user]);

  const handleCreateWager = (game: any) => {
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

  const onJoinWager = (wagerId: string, stakeAmount: number) => {
    handleJoinWager(wagerId, stakeAmount, wagers, () => {
      loadWagers();
      loadUserBalance();
    });
  };

  const onLeaveWager = (wagerId: string) => {
    handleLeaveWager(wagerId, () => {
      loadWagers();
      loadUserBalance();
    });
  };

  // Simple game list for non-authenticated users
  if (!user) {
    return (
      <GamesVisitorView 
        games={games} 
        wagers={wagers} 
        loading={loading} 
      />
    );
  }

  // Full dashboard for authenticated users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <GamesHeader 
          onCreateChallenge={() => setCreateModalOpen(true)}
          onSuggestGame={() => setSuggestModalOpen(true)}
        />
        
        {/* Wallet Balance */}
        <WalletBalanceCard balance={userBalance} />

        {/* Stats Cards */}
        <GamesStatsCards wagers={wagers} games={games} />

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
                    onJoin={onJoinWager}
                    onLeave={onLeaveWager}
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

      <ComprehensiveLegalModal
        open={showLegalModal}
        onAccept={() => setShowLegalModal(false)}
        onClose={() => setShowLegalModal(false)}
        actionText="Join Queue"
      />
    </div>
  );
};

export default Games;