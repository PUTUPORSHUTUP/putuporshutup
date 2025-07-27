import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Gamepad2, Users, Trophy, Target, Settings } from 'lucide-react';
import { ChallengeType } from '@/types/wager';

interface PopularChallengeSelectorProps {
  selectedType: ChallengeType | 'custom';
  onTypeChange: (type: ChallengeType | 'custom') => void;
}

export const PopularChallengeSelector = ({ selectedType, onTypeChange }: PopularChallengeSelectorProps) => {
  const popularTypes = [
    {
      id: '1v1' as ChallengeType,
      title: '1v1 Match',
      description: 'Classic head-to-head competition',
      icon: <Gamepad2 className="w-6 h-6" />,
      badge: 'Most Popular',
      badgeVariant: 'default' as const,
      features: ['Quick setup', 'Winner takes all', 'Instant results'],
      popularity: 95
    },
    {
      id: 'team_vs_team' as ChallengeType,
      title: 'Team Battle',
      description: 'Coordinate with teammates to win',
      icon: <Users className="w-6 h-6" />,
      badge: 'Team Play',
      badgeVariant: 'secondary' as const,
      features: ['Team coordination', 'Higher stakes', 'Group rewards'],
      popularity: 80
    },
    {
      id: 'lobby_competition' as ChallengeType,
      title: 'Lobby Competition',
      description: 'Compete in the same lobby',
      icon: <Trophy className="w-6 h-6" />,
      badge: 'Social',
      badgeVariant: 'outline' as const,
      features: ['Same lobby/match', 'Performance based', 'Multiple winners'],
      popularity: 60
    },
    {
      id: 'stat_based' as ChallengeType,
      title: 'Stat Challenge',
      description: 'Beat specific performance goals',
      icon: <Target className="w-6 h-6" />,
      badge: 'Skill Based',
      badgeVariant: 'outline' as const,
      features: ['Custom goals', 'Personal targets', 'Skill demonstration'],
      popularity: 45
    }
  ];

  const customOption = {
    id: 'custom' as const,
    title: 'Custom Setup',
    description: 'Advanced configuration options',
    icon: <Settings className="w-6 h-6" />,
    badge: 'Advanced',
    badgeVariant: 'outline' as const,
    features: ['Full customization', 'Advanced options', 'Expert mode']
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">Choose Challenge Type</Label>
        <p className="text-sm text-muted-foreground">Select from popular options or create a custom challenge</p>
      </div>
      
      <RadioGroup value={selectedType} onValueChange={onTypeChange} className="space-y-3">
        {/* Popular Challenge Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularTypes.map((type) => (
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
                <Card className={`transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${
                  selectedType === type.id 
                    ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-lg' 
                    : 'hover:bg-accent/50 border-border'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {type.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{type.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={type.badgeVariant}>{type.badge}</Badge>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Popularity</div>
                          <div className="text-sm font-medium">{type.popularity}%</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
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
        </div>

        {/* Custom Option */}
        <div className="relative mt-6">
          <RadioGroupItem
            value="custom"
            id="custom"
            className="peer sr-only"
          />
          <Label
            htmlFor="custom"
            className="cursor-pointer block w-full"
          >
            <Card className={`transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer border-dashed ${
              selectedType === 'custom' 
                ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-lg' 
                : 'hover:bg-accent/50 border-border'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      {customOption.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customOption.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{customOption.description}</p>
                    </div>
                  </div>
                  <Badge variant={customOption.badgeVariant}>{customOption.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {customOption.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};