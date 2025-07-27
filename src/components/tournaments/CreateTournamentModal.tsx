import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  DollarSign, 
  Users, 
  Trophy, 
  Calendar,
  Crown,
  Star,
  Target,
  Zap,
  Shield,
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

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

type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss_system' | 'custom';

export const CreateTournamentModal = ({ 
  open, 
  onOpenChange, 
  selectedGame, 
  onTournamentCreated 
}: CreateTournamentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [tournamentType, setTournamentType] = useState<TournamentType>('single_elimination');
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorshipTier, setSponsorshipTier] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('bronze');
  const [form, setForm] = useState({
    gameId: '',
    title: '',
    description: '',
    entryFee: '',
    maxParticipants: '8',
    platform: '',
    startTime: '',
    customRules: '',
    prizePayout: 'standard' // standard, custom
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const tournamentTypes = [
    {
      id: 'single_elimination' as TournamentType,
      title: 'Single Elimination',
      description: 'Fast knockout format - lose once and you\'re out',
      icon: <Zap className="w-5 h-5" />,
      badge: 'Fast',
      features: ['Quick matches', 'High stakes', 'Clear winner'],
      difficulty: 'Beginner'
    },
    {
      id: 'double_elimination' as TournamentType,
      title: 'Double Elimination',
      description: 'Second chance bracket - two losses eliminate you',
      icon: <Shield className="w-5 h-5" />,
      badge: 'Balanced',
      features: ['Second chances', 'Fair competition', 'Longer tournament'],
      difficulty: 'Intermediate'
    },
    {
      id: 'round_robin' as TournamentType,
      title: 'Round Robin',
      description: 'Everyone plays everyone - most wins takes all',
      icon: <Users className="w-5 h-5" />,
      badge: 'Fair',
      features: ['All play all', 'Skill-based', 'Most matches'],
      difficulty: 'Intermediate'
    },
    {
      id: 'swiss_system' as TournamentType,
      title: 'Swiss System',
      description: 'Balanced matchmaking based on performance',
      icon: <Target className="w-5 h-5" />,
      badge: 'Pro',
      features: ['Smart pairing', 'Balanced competition', 'No elimination'],
      difficulty: 'Advanced'
    },
    {
      id: 'custom' as TournamentType,
      title: 'Custom Tournament',
      description: 'Create your own rules and format',
      icon: <Crown className="w-5 h-5" />,
      badge: 'Custom',
      features: ['Full control', 'Unique rules', 'Creative formats'],
      difficulty: 'Expert'
    }
  ];

  const sponsorshipTiers = [
    {
      id: 'bronze' as const,
      name: 'Bronze Sponsor',
      cost: 50,
      multiplier: 1.5,
      entryFeeMultiplier: 1.0, // Keep normal entry fee
      features: ['+$50 Prize Pool', 'Sponsor Badge', 'Featured Listing'],
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'silver' as const,
      name: 'Silver Sponsor',
      cost: 100,
      multiplier: 2.0,
      entryFeeMultiplier: 1.2, // 20% higher entry fee
      features: ['+$100 Prize Pool', 'Premium Badge', 'Top Placement', 'Chat Highlights'],
      color: 'from-gray-400 to-gray-500'
    },
    {
      id: 'gold' as const,
      name: 'Gold Sponsor',
      cost: 250,
      multiplier: 3.0,
      entryFeeMultiplier: 1.5, // 50% higher entry fee
      features: ['+$250 Prize Pool', 'Gold Badge', 'Homepage Feature', 'Stream Priority'],
      color: 'from-yellow-400 to-yellow-500'
    },
    {
      id: 'platinum' as const,
      name: 'Platinum Sponsor',
      cost: 500,
      multiplier: 5.0,
      entryFeeMultiplier: 2.0, // 100% higher entry fee (double)
      features: ['+$500 Prize Pool', 'Platinum Badge', 'Dedicated Page', 'Live Commentary'],
      color: 'from-purple-400 to-purple-500'
    }
  ];

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

  const calculatePrizePool = () => {
    const baseEntryFee = parseFloat(form.entryFee || '0');
    const participants = parseInt(form.maxParticipants);
    
    if (isSponsored) {
      const tier = sponsorshipTiers.find(t => t.id === sponsorshipTier);
      const multipliedEntryFee = baseEntryFee * (tier?.entryFeeMultiplier || 1);
      const basePrize = multipliedEntryFee * participants;
      const sponsorContribution = tier?.cost || 0;
      return basePrize + sponsorContribution;
    }
    
    return baseEntryFee * participants;
  };

  const getTotalCost = () => {
    const baseEntryFee = parseFloat(form.entryFee || '0');
    if (isSponsored) {
      const tier = sponsorshipTiers.find(t => t.id === sponsorshipTier);
      const multipliedEntryFee = baseEntryFee * (tier?.entryFeeMultiplier || 1);
      const sponsorCost = tier?.cost || 0;
      return multipliedEntryFee + sponsorCost;
    }
    return baseEntryFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const entryFee = parseFloat(form.entryFee);
      const maxParticipants = parseInt(form.maxParticipants);
      const totalCost = getTotalCost();

      if (entryFee <= 0) {
        toast({
          title: "Invalid entry fee",
          description: "Entry fee must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Check user's wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance, is_premium')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.wallet_balance < totalCost) {
        toast({
          title: "Insufficient Funds",
          description: `You need $${totalCost.toFixed(2)} to create this tournament (Entry: $${entryFee} + Sponsorship: $${(totalCost - entryFee).toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }

      // Check if sponsorship requires premium
      if (isSponsored && !profile.is_premium) {
        toast({
          title: "Premium Required",
          description: "Tournament sponsorship is only available to premium members",
          variant: "destructive",
        });
        return;
      }

      const prizePool = calculatePrizePool();
      const sponsorshipData = isSponsored ? {
        sponsored: true,
        sponsorship_tier: sponsorshipTier,
        sponsor_cost: sponsorshipTiers.find(t => t.id === sponsorshipTier)?.cost || 0
      } : { sponsored: false };

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
          prize_pool: prizePool,
          platform: form.platform,
          start_time: form.startTime ? new Date(form.startTime).toISOString() : null,
          tournament_type: tournamentType,
          custom_rules: form.customRules || null,
          ...sponsorshipData
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
          wallet_balance: profile.wallet_balance - totalCost 
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
        startTime: '',
        customRules: '',
        prizePayout: 'standard'
      });
      setTournamentType('single_elimination');
      setIsSponsored(false);

      onTournamentCreated();
      onOpenChange(false);

      toast({
        title: "Tournament Created!",
        description: isSponsored ? "Your sponsored tournament is now live with enhanced prize pool!" : "Your tournament is now open for registration.",
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
  const selectedTournamentType = tournamentTypes.find(t => t.id === tournamentType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            CREATE TOURNAMENT
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Tournament Format</Label>
              <p className="text-sm text-muted-foreground">Choose your competition style</p>
            </div>
            
            <RadioGroup value={tournamentType} onValueChange={(value: TournamentType) => setTournamentType(value)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournamentTypes.map((type) => (
                  <div key={type.id} className="relative">
                    <RadioGroupItem
                      value={type.id}
                      id={type.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={type.id}
                      className="cursor-pointer block w-full"
                    >
                      <Card className={`transition-all hover:shadow-md cursor-pointer h-full ${
                        tournamentType === type.id 
                          ? 'ring-2 ring-primary border-primary bg-primary/10' 
                          : 'hover:bg-accent/50 border-border'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {type.icon}
                              <div>
                                <CardTitle className="text-base">{type.title}</CardTitle>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{type.badge}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {type.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Difficulty: {type.difficulty}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* High Roller Sponsorship Option */}
          <Card className="border-2 border-gradient-to-r from-yellow-200 to-yellow-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg">Sponsor This Tournament</CardTitle>
                    <p className="text-sm text-muted-foreground">Boost prize pools and generate serious revenue</p>
                  </div>
                </div>
                <Switch checked={isSponsored} onCheckedChange={setIsSponsored} />
              </div>
            </CardHeader>
            
            {isSponsored && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sponsorshipTiers.map((tier) => (
                    <div key={tier.id} className="relative">
                      <input
                        type="radio"
                        id={tier.id}
                        name="sponsorship"
                        value={tier.id}
                        checked={sponsorshipTier === tier.id}
                        onChange={(e) => setSponsorshipTier(e.target.value as any)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={tier.id}
                        className="cursor-pointer block w-full"
                      >
                        <Card className={`transition-all hover:shadow-lg cursor-pointer ${
                          sponsorshipTier === tier.id 
                            ? 'ring-2 ring-yellow-400 border-yellow-400' 
                            : 'hover:border-yellow-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className={`bg-gradient-to-r ${tier.color} text-white p-3 rounded-lg mb-3`}>
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold">{tier.name}</h3>
                                <Star className="w-5 h-5" />
                              </div>
                              <div className="text-xl font-bold">${tier.cost}</div>
                              <div className="text-sm opacity-90">{tier.multiplier}x Prize Multiplier</div>
                            </div>
                            <div className="space-y-1">
                              {tier.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </label>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Sponsorship multiplies the final prize pool and gives your tournament premium visibility. 
                    Revenue from sponsorships helps us improve the platform and offer better features!
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>

          {/* Game and Platform Selection */}
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

          {/* Tournament Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tournament Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Ultimate FIFA Championship"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Tournament Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tournament rules, prizes, and information..."
                rows={3}
              />
            </div>

            {tournamentType === 'custom' && (
              <div>
                <Label htmlFor="customRules">Custom Rules & Format</Label>
                <Textarea
                  id="customRules"
                  value={form.customRules}
                  onChange={(e) => setForm(prev => ({ ...prev, customRules: e.target.value }))}
                  placeholder="Describe your custom tournament format, special rules, scoring system..."
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Tournament Settings */}
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
                  <SelectItem value="64">64 Players</SelectItem>
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
            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      <span className="text-lg font-bold">Total Prize Pool</span>
                    </div>
                    <Badge variant="default" className="text-xl px-4 py-2">
                      ${calculatePrizePool().toFixed(2)}
                    </Badge>
                  </div>
                  
                   {isSponsored && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Base Entry Fee (per player):</span>
                        <span>${parseFloat(form.entryFee || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adjusted Entry Fee ({(sponsorshipTiers.find(t => t.id === sponsorshipTier)?.entryFeeMultiplier || 1)}x):</span>
                        <span>${(parseFloat(form.entryFee || '0') * (sponsorshipTiers.find(t => t.id === sponsorshipTier)?.entryFeeMultiplier || 1)).toFixed(2)} per player</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entry Fees Total:</span>
                        <span>${(parseFloat(form.entryFee || '0') * (sponsorshipTiers.find(t => t.id === sponsorshipTier)?.entryFeeMultiplier || 1) * parseInt(form.maxParticipants)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-600">
                        <span>Sponsor Contribution:</span>
                        <span>+${(sponsorshipTiers.find(t => t.id === sponsorshipTier)?.cost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Your Total Cost:</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">${getTotalCost().toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          Entry: ${form.entryFee} {isSponsored && `+ Sponsorship: $${(getTotalCost() - parseFloat(form.entryFee || '0')).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  </div>
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
            <Button type="submit" disabled={loading} size="lg">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSponsored ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Create Sponsored Tournament
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Tournament
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};