import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, UserCheck, Link, Target, Filter, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChallengeTypeFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  challengeCounts: Record<string, number>;
}

export const ChallengeTypeFilter = ({ selectedType, onTypeChange, challengeCounts }: ChallengeTypeFilterProps) => {
  const challengeTypes = [
    { 
      id: 'all', 
      label: 'All Challenges', 
      icon: Filter, 
      color: 'text-primary',
      description: 'View all available challenges across all game modes'
    },
    { 
      id: '1v1', 
      label: '1 vs 1', 
      icon: Gamepad2, 
      color: 'text-primary',
      description: 'Head-to-head matches between two players with winner takes all'
    },
    { 
      id: 'team_vs_team', 
      label: 'Team vs Team', 
      icon: UserCheck, 
      color: 'text-blue-600',
      description: 'Team-based challenges where groups compete against each other'
    },
    { 
      id: 'lobby_competition', 
      label: 'Lobby Competition', 
      icon: Link, 
      color: 'text-purple-600',
      description: 'Multi-player lobbies where participants compete for the pot based on performance'
    },
    { 
      id: 'stat_based', 
      label: 'Stat Challenge', 
      icon: Target, 
      color: 'text-orange-600',
      description: 'Performance-based challenges where winners are determined by specific game statistics'
    }
  ];

  const getInfoTooltip = (description: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{description}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Filter Buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            {challengeTypes.map((type) => {
              const Icon = type.icon;
              const count = challengeCounts[type.id] || 0;
              const isSelected = selectedType === type.id;
              
              return (
                <div key={type.id} className="flex items-center gap-1">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTypeChange(type.id)}
                    className={`flex items-center gap-2 ${!isSelected ? type.color : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{type.label}</span>
                    <Badge variant={isSelected ? "secondary" : "outline"} className="ml-1">
                      {count}
                    </Badge>
                  </Button>
                  {getInfoTooltip(type.description)}
                </div>
              );
            })}
          </div>

          {/* Mobile Filter Dropdown */}
          <div className="md:hidden space-y-2">
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {challengeTypes.map((type) => {
                  const Icon = type.icon;
                  const count = challengeCounts[type.id] || 0;
                  
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                        <Badge variant="outline" className="ml-1">
                          {count}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* Mobile Info Section */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" />
                <span className="font-medium">Challenge Type Info</span>
              </div>
              {challengeTypes.find(type => type.id === selectedType)?.description}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};