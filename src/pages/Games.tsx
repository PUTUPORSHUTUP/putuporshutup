import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateWagerModal } from '@/components/games/CreateWagerModal';
import { WagerCard } from '@/components/games/WagerCard';
import { SuggestGameModal } from '@/components/games/SuggestGameModal';
import { AddGameModal } from '@/components/games/AddGameModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trophy, DollarSign, Users, Gamepad2, Lightbulb, Settings } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
  image_url?: string;
  is_active: boolean;
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
  created_at: string;
  game: Game;
  participant_count: number;
  user_participated?: boolean;
}

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [addGameModalOpen, setAddGameModalOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();

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
      // First get all open wagers
      const { data: allWagers, error: wagersError } = await supabase
        .from('wagers')
        .select(`
          *,
          game:games(*),
          participant_count:wager_participants(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (wagersError) {
        console.error('Error loading wagers:', wagersError);
        return;
      }

      // Then check which wagers the current user participates in
      let userParticipations: string[] = [];
      if (user) {
        const { data: participations } = await supabase
          .from('wager_participants')
          .select('wager_id')
          .eq('user_id', user.id);
        
        userParticipations = participations?.map(p => p.wager_id) || [];
      }

      const wagersWithCount = (allWagers as any)?.map((wager: any) => ({
        ...wager,
        participant_count: wager.participant_count?.[0]?.count || 0,
        user_participated: userParticipations.includes(wager.id),
        status: wager.status as 'open' | 'in_progress' | 'completed' | 'cancelled'
      })) || [];

      setWagers(wagersWithCount as Wager[]);
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
        .from('wager_participants')
        .select('id')
        .eq('wager_id', wagerId)
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
        .from('wager_participants')
        .insert({
          wager_id: wagerId,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-gaming text-primary">GAMES & WAGERS</h1>
            <p className="text-muted-foreground mt-2">Challenge players and win big</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Wallet Balance */}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-lg font-bold">${userBalance.toFixed(2)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/profile'}
                  className="ml-auto"
                >
                  Add Funds
                </Button>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
            <Button 
              onClick={() => setSuggestModalOpen(true)}
              variant="outline"
              size="lg"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              SUGGEST GAME
            </Button>
            <Button 
              onClick={() => setAddGameModalOpen(true)}
              variant="outline"
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              ADD GAME
            </Button>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              CREATE WAGER
            </Button>
            </div>
          </div>
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
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="browse">Browse Wagers</TabsTrigger>
            <TabsTrigger value="games">All Games</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : wagers.length === 0 ? (
              <Card className="p-12 text-center">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Active Wagers</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a challenge and start earning!
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    Create First Wager
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wagers.map((wager) => (
                  <WagerCard 
                    key={wager.id} 
                    wager={wager} 
                    onJoin={handleJoinWager}
                    onLeave={handleLeaveWager}
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
        </Tabs>
      </div>

      {/* Modals */}
      <CreateWagerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedGame={selectedGame}
        onWagerCreated={handleWagerCreated}
      />
      
      <SuggestGameModal
        open={suggestModalOpen}
        onOpenChange={setSuggestModalOpen}
      />
      
      <AddGameModal
        open={addGameModalOpen}
        onOpenChange={setAddGameModalOpen}
        onGameAdded={loadGames}
      />
    </div>
  );
};

export default Games;