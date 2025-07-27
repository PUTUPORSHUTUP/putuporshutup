import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChallengeTypeSelector } from '@/components/games/ChallengeTypeSelector';
import { ChallengeType } from '@/types/wager';
import { 
  Target, 
  Clock, 
  Users, 
  DollarSign, 
  Gamepad2, 
  Monitor,
  Zap,
  StopCircle,
  CheckCircle 
} from 'lucide-react';

interface QuickMatchProps {
  onMatchFound?: (wagerId: string) => void;
}

interface Game {
  id: string;
  display_name: string;
  name: string;
  platform: string[];
}

interface QueueEntry {
  id: string;
  stake_amount: number;
  game_id: string;
  platform: string;
  challenge_type?: ChallengeType;
  queue_status: string;
  queued_at: string;
  expires_at: string;
  matched_with_user_id?: string;
  wager_id?: string;
  games?: {
    display_name: string;
  };
}

const AVAILABLE_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

export const QuickMatch = ({ onMatchFound }: QuickMatchProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [currentQueue, setCurrentQueue] = useState<QueueEntry | null>(null);
  const [queueStats, setQueueStats] = useState({ totalInQueue: 0, averageWaitTime: 0 });
  const [timeInQueue, setTimeInQueue] = useState(0);
  
  // Form state
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [challengeType, setChallengeType] = useState<ChallengeType>('1v1');
  const [stakeAmount, setStakeAmount] = useState(25);

  useEffect(() => {
    loadGames();
    checkCurrentQueue();
    loadQueueStats();
  }, [user]);

  useEffect(() => {
    if (!currentQueue) return;

    // Set up real-time subscription for queue updates
    const channel = supabase
      .channel(`match-queue-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_queue',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Queue update:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedEntry = payload.new as QueueEntry;
            setCurrentQueue(updatedEntry);
            
            if (updatedEntry.queue_status === 'matched' && updatedEntry.wager_id) {
              toast({
                title: "Match Found! 🎉",
                description: "You've been matched with another player!",
              });
              onMatchFound?.(updatedEntry.wager_id);
            }
          }
        }
      )
      .subscribe();

    // Timer for queue time
    const timer = setInterval(() => {
      setTimeInQueue(prev => prev + 1);
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [currentQueue, user?.id, onMatchFound, toast]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setGames(data || []);
      
      if (data && data.length > 0 && !selectedGame) {
        setSelectedGame(data[0].id);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive"
      });
    }
  };

  const checkCurrentQueue = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('match_queue')
        .select(`
          *,
          games (
            display_name
          )
        `)
        .eq('user_id', user.id)
        .eq('queue_status', 'searching')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentQueue(data);
        const queuedTime = Math.floor((Date.now() - new Date(data.queued_at).getTime()) / 1000);
        setTimeInQueue(queuedTime);
      }
    } catch (error) {
      console.error('Error checking queue:', error);
    }
  };

  const loadQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('match_queue')
        .select('queued_at')
        .eq('queue_status', 'searching');

      if (error) throw error;

      setQueueStats({
        totalInQueue: data?.length || 0,
        averageWaitTime: 0 // Could calculate this based on historical data
      });
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  const joinQueue = async () => {
    if (!user || !selectedGame || !selectedPlatform || !challengeType) {
      toast({
        title: "Missing Information",
        description: "Please select a game, platform, and challenge type",
        variant: "destructive"
      });
      return;
    }

    // Check wallet balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.wallet_balance < stakeAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this stake amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute default

      const { data, error } = await supabase
        .from('match_queue')
        .insert({
          user_id: user.id,
          stake_amount: stakeAmount,
          game_id: selectedGame,
          platform: selectedPlatform,
          challenge_type: challengeType,
          expires_at: expiresAt.toISOString()
        })
        .select(`
          *,
          games (
            display_name
          )
        `)
        .single();

      if (error) throw error;

      setCurrentQueue(data);
      setTimeInQueue(0);

      // Trigger matching algorithm
      supabase.functions.invoke('match-players');

      toast({
        title: "Joined Queue",
        description: "Looking for an opponent... You'll be notified when a match is found!"
      });
    } catch (error: any) {
      console.error('Error joining queue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join matching queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    if (!currentQueue) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('match_queue')
        .update({ queue_status: 'cancelled' })
        .eq('id', currentQueue.id);

      if (error) throw error;

      setCurrentQueue(null);
      setTimeInQueue(0);

      toast({
        title: "Left Queue",
        description: "You've been removed from the matching queue"
      });
    } catch (error: any) {
      console.error('Error leaving queue:', error);
      toast({
        title: "Error",
        description: "Failed to leave queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const selectedGameData = games.find(g => g.id === selectedGame);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quick Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentQueue ? (
          // In Queue View
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-lg font-medium">Searching for opponent...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Time in queue: {formatTime(timeInQueue)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">${currentQueue.stake_amount}</p>
                <p className="text-sm text-muted-foreground">Stake Amount</p>
              </div>
              <div>
                <p className="text-lg font-medium">{currentQueue.games?.display_name}</p>
                <p className="text-sm text-muted-foreground">Game</p>
              </div>
              <div>
                <p className="text-lg font-medium">{currentQueue.platform}</p>
                <p className="text-sm text-muted-foreground">Platform</p>
              </div>
              <div>
                <p className="text-lg font-medium">{currentQueue.challenge_type?.replace('_', ' ') || '1v1'}</p>
                <p className="text-sm text-muted-foreground">Type</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Queue Stats</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {queueStats.totalInQueue} players currently in queue
              </p>
            </div>

            <Button 
              onClick={leaveQueue} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Leave Queue
            </Button>
          </div>
        ) : (
          // Join Queue Form
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="game-select">Game</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-4 w-4" />
                        {game.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-select">Platform</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PLATFORMS.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        {platform}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ChallengeTypeSelector 
              selectedType={challengeType}
              onTypeChange={setChallengeType}
            />

            <div className="space-y-2">
              <Label htmlFor="stake-amount">Stake Amount ($)</Label>
              <Input
                id="stake-amount"
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                min={1}
                max={1000}
                step={1}
              />
              <p className="text-sm text-muted-foreground">
                Amount to challenge for this match
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Queue Information</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {queueStats.totalInQueue} players currently looking for matches
              </p>
            </div>

            <Button 
              onClick={joinQueue} 
              disabled={loading || !selectedGame || !selectedPlatform || !challengeType}
              className="w-full"
            >
              <Zap className="h-4 w-4 mr-2" />
              {loading ? "Joining..." : "Find Match"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};