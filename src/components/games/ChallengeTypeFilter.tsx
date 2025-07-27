import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, UserCheck, Link, Target, Filter } from 'lucide-react';

interface ChallengeTypeFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  challengeCounts: Record<string, number>;
}

export const ChallengeTypeFilter = ({ selectedType, onTypeChange, challengeCounts }: ChallengeTypeFilterProps) => {
  const challengeTypes = [
    { id: 'all', label: 'All Challenges', icon: Filter, color: 'text-primary' },
    { id: '1v1', label: '1 vs 1', icon: Gamepad2, color: 'text-primary' },
    { id: 'team_vs_team', label: 'Team vs Team', icon: UserCheck, color: 'text-blue-600' },
    { id: 'lobby_competition', label: 'Lobby Competition', icon: Link, color: 'text-purple-600' },
    { id: 'stat_based', label: 'Stat Challenge', icon: Target, color: 'text-orange-600' }
  ];

  return (
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
              <Button
                key={type.id}
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
            );
          })}
        </div>

        {/* Mobile Filter Dropdown */}
        <div className="md:hidden">
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
        </div>
      </CardContent>
    </Card>
  );
};