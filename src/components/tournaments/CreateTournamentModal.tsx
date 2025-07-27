import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, DollarSign, Users, Trophy, Calendar } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  display_name: string;
  platform: string[];
}

interface CreateTournamentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGame?: Game | null;
  onTournamentCreated: () => void;
}

export const CreateTournamentModal = ({ 
  open, 
  onOpenChange, 
  selectedGame, 
  onTournamentCreated 
}: CreateTournamentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState({
    gameId: '',
    title: '',
    description: '',
    entryFee: '',
    maxParticipants: '8',
    platform: '',
    startTime: ''
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
      const entryFee = parseFloat(form.entryFee);
      const maxParticipants = parseInt(form.maxParticipants);

      if (entryFee <= 0) {
        toast({
          title: "Invalid entry fee",
          description: "Entry fee must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check user's wallet balance (they need to pay entry fee as creator)
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < entryFee) {
        toast({
          title: "Insufficient Funds",
          description: "You need enough funds to pay the entry fee as tournament creator.",
          variant: "destructive",
        });
        return;
      }

      // Create the tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          creator_id: user.id,
          game_id: form.gameId,
          title: form.title,
          description: form.description,
          entry_fee: entryFee,
          max_participants: maxParticipants,
          current_participants: 1,
          prize_pool: entryFee,
          platform: form.platform,
          start_time: form.startTime ? new Date(form.startTime).toISOString() : null
        })
        .select()
        .single();

      if (tournamentError) {
        toast({
          title: "Error creating tournament",
          description: tournamentError.message,
          variant: "destructive",
        });
        return;
      }

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          entry_paid: entryFee,
          bracket_position: 1
        });

      if (participantError) {
        console.error('Error adding creator as participant:', participantError);
      }

      // Update user's wallet balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance - entryFee 
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
        entryFee: '',
        maxParticipants: '8',
        platform: '',
        startTime: ''
      });

      onTournamentCreated();
      onOpenChange(false);

      toast({
        title: "Tournament Created!",
        description: "Your tournament is now open for registration.",
      });

    } catch (error) {
      console.error('Error creating tournament:', error);
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
          <DialogTitle className="font-gaming text-xl">CREATE TOURNAMENT</DialogTitle>
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
            <Label htmlFor="title">Tournament Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., FIFA 25 Championship"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tournament rules and information..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryFee">Entry Fee</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="entryFee"
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.entryFee}
                  onChange={(e) => setForm(prev => ({ ...prev, entryFee: e.target.value }))}
                  className="pl-9"
                  placeholder="25.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxParticipants">Max Players</Label>
              <Select value={form.maxParticipants} onValueChange={(value) => setForm(prev => ({ ...prev, maxParticipants: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                  <SelectItem value="16">16 Players</SelectItem>
                  <SelectItem value="32">32 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startTime">Start Time (Optional)</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Prize Pool Preview */}
          {form.entryFee && form.maxParticipants && (
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Maximum Prize Pool</span>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    ${(parseFloat(form.entryFee || '0') * parseInt(form.maxParticipants)).toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

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
              Create Tournament
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};