import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-components';
import { ChallengeTypeSelector } from './ChallengeTypeSelector';
import { PopularChallengeSelector } from './PopularChallengeSelector';
import { calculateChallengeFee } from '@/lib/feeCalculator';
import { ChallengeType, VerificationMethod } from '@/types/wager';

interface Game {
  id: string;
  name: string;
  display_name: string;
}

interface ChallengeFormProps {
  games: Game[];
  selectedGame: Game | null;
  onSubmit: (formData: any) => void;
  loading: boolean;
}

export const ChallengeForm = ({ games, selectedGame, onSubmit, loading }: ChallengeFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stake_amount: '',
    game_id: selectedGame?.id || '',
    platform: '',
    max_participants: 2,
    challenge_type: 'DIRECT' as ChallengeType,
    verification_method: 'SCREENSHOT' as VerificationMethod,
    custom_rules: '',
    entry_fee: 0,
    prize_pool: 0
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate fees when stake amount changes
      if (field === 'stake_amount') {
        const stakeAmount = parseFloat(value) || 0;
        const feeResult = calculateChallengeFee(stakeAmount);
        updated.entry_fee = feeResult.platformFee;
        updated.prize_pool = feeResult.totalToWinner;
      }
      
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter challenge title..."
              required
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your challenge..."
              rows={3}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="game">Game</Label>
              <Select
                value={formData.game_id}
                onValueChange={(value) => handleInputChange('game_id', value)}
              >
                <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
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

            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount ($)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                min="0"
                value={formData.stake_amount}
                onChange={(e) => handleInputChange('stake_amount', e.target.value)}
                placeholder="0.00"
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Configuration */}
      <Card className="animate-fade-in-up animation-delay-100">
        <CardHeader>
          <CardTitle>Challenge Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChallengeTypeSelector
            selectedType={formData.challenge_type}
            onTypeChange={(type) => handleInputChange('challenge_type', type)}
          />

          <PopularChallengeSelector
            selectedType={formData.challenge_type}
            onTypeChange={(type) => handleInputChange('challenge_type', type)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => handleInputChange('platform', value)}
              >
                <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="PlayStation">PlayStation</SelectItem>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Cross-Platform">Cross-Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Select
                value={formData.max_participants.toString()}
                onValueChange={(value) => handleInputChange('max_participants', parseInt(value))}
              >
                <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 4, 8, 16, 32].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Players
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Information */}
      {formData.stake_amount && (
        <Card className="animate-fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 animate-gentle-bounce" />
              Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Stake Amount:</span>
                <span className="font-medium">${formData.stake_amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="font-medium">${formData.entry_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Prize Pool:</span>
                <span className="font-semibold text-money-green">
                  ${formData.prize_pool.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <AnimatedButton
        type="submit"
        disabled={loading || !formData.title || !formData.game_id || !formData.stake_amount}
        className="w-full"
        size="lg"
        animationType="glow"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Challenge
      </AnimatedButton>
    </form>
  );
};