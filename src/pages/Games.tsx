import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateWagerModal } from '@/components/games/CreateWagerModal';
import { WagerCard } from '@/components/games/WagerCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trophy, DollarSign, Users, Gamepad2 } from 'lucide-react';

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
  creator_profile: {
    username: string | null;
    display_name: string | null;
  } | null;
  participant_count: number;
}

const Games = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [wagers, setWagers] = useState<Wager[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadGames();
    loadWagers();
  }, []);

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
      const { data, error } = await supabase
        .from('wagers')
        .select(`
          *,
          game:games(*),
          creator_profile:profiles!creator_id(username, display_name),
          participant_count:wager_participants(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading wagers:', error);
        return;
      }

      const wagersWithCount = (data as any)?.map((wager: any) => ({
        ...wager,
        participant_count: wager.participant_count?.[0]?.count || 0,
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
      // Check user's wallet balance first
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < stakeAmount) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough funds in your wallet to join this wager.",
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

      loadWagers();
    } catch (error) {
      console.error('Error joining wager:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            CREATE WAGER
          </Button>
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
                    currentUserId={user?.id}
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

      {/* Create Wager Modal */}
      <CreateWagerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        selectedGame={selectedGame}
        onWagerCreated={handleWagerCreated}
      />
    </div>
  );
};

export default Games;