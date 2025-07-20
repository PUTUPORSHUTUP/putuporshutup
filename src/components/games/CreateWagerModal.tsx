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
import { Loader2, DollarSign } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string;
  platform: string[];
}

interface CreateWagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGame: Game | null;
  onWagerCreated: () => void;
}

export const CreateWagerModal = ({ 
  open, 
  onOpenChange, 
  selectedGame, 
  onWagerCreated 
}: CreateWagerModalProps) => {
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

  const { user } = useAuth();
  const { toast } = useToast();

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

      // Check user's wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < stakeAmount) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough funds to create this wager.",
          variant: "destructive",
        });
        return;
      }

      // Create the wager
      const { data: wager, error: wagerError } = await supabase
        .from('wagers')
        .insert({
          creator_id: user.id,
          game_id: form.gameId,
          title: form.title,
          description: form.description,
          stake_amount: stakeAmount,
          max_participants: parseInt(form.maxParticipants),
          platform: form.platform,
          game_mode: form.gameMode,
          total_pot: stakeAmount
        })
        .select()
        .single();

      if (wagerError) {
        toast({
          title: "Error creating wager",
          description: wagerError.message,
          variant: "destructive",
        });
        return;
      }

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from('wager_participants')
        .insert({
          wager_id: wager.id,
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

      onWagerCreated();
    } catch (error) {
      console.error('Error creating wager:', error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-gaming text-xl">CREATE NEW WAGER</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div>
            <Label htmlFor="title">Wager Title</Label>
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

          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="16">16 Players</SelectItem>
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

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Wager
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};