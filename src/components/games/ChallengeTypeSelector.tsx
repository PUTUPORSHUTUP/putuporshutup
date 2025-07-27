import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Trophy, Gamepad2 } from 'lucide-react';
import { WagerType } from '@/types/wager';

interface WagerTypeSelectorProps {
  selectedType: WagerType;
  onTypeChange: (type: WagerType) => void;
}

export const WagerTypeSelector = ({ selectedType, onTypeChange }: WagerTypeSelectorProps) => {
  const wagerTypes = [
    {
      id: '1v1' as WagerType,
      title: '1 vs 1',
      description: 'Classic head-to-head competition',
      icon: <Gamepad2 className="w-5 h-5" />,
      badge: 'Classic',
      features: ['Direct competition', 'Quick setup', 'Instant results']
    },
    {
      id: 'team_vs_team' as WagerType,
      title: 'Team vs Team',
      description: 'Groups compete against each other',
      icon: <Users className="w-5 h-5" />,
      badge: 'Popular',
      features: ['Team coordination', 'Higher stakes', 'Group rewards']
    },
    {
      id: 'lobby_competition' as WagerType,
      title: 'Lobby Competition',
      description: 'Individual performance in shared lobby',
      icon: <Trophy className="w-5 h-5" />,
      badge: 'Social',
      features: ['Same lobby/match', 'Individual stats', 'Performance based']
    },
    {
      id: 'stat_based' as WagerType,
      title: 'Stat Challenge',
      description: 'Bet on achieving specific performance goals',
      icon: <Target className="w-5 h-5" />,
      badge: 'Skill',
      features: ['Custom goals', 'Personal targets', 'Skill demonstration']
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Wager Type</Label>
        <p className="text-sm text-muted-foreground">Choose how players will compete</p>
      </div>
      
      <RadioGroup value={selectedType} onValueChange={onTypeChange} className="space-y-3">
        {wagerTypes.map((type) => (
          <div key={type.id} className="relative">
            <RadioGroupItem
              value={type.id}
              id={type.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={type.id}
              className="cursor-pointer"
            >
              <Card className="transition-all hover:shadow-md peer-checked:ring-2 peer-checked:ring-primary peer-checked:border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {type.icon}
                      <div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{type.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};