import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Target, Users, Trophy, Plus, Trash2 } from 'lucide-react';
import { StatCriteria } from '@/types/wager';

interface LobbyStatChallengeConfigProps {
  lobbyId: string;
  onLobbyIdChange: (id: string) => void;
  statCriteria: StatCriteria[];
  onStatCriteriaChange: (criteria: StatCriteria[]) => void;
  teamPreference: 'same' | 'opposite' | 'any';
  onTeamPreferenceChange: (preference: 'same' | 'opposite' | 'any') => void;
}

export const LobbyStatChallengeConfig = ({
  lobbyId,
  onLobbyIdChange,
  statCriteria,
  onStatCriteriaChange,
  teamPreference,
  onTeamPreferenceChange
}: LobbyStatChallengeConfigProps) => {
  const [newCriteria, setNewCriteria] = useState<StatCriteria>({
    type: 'kills',
    comparison: 'highest',
    description: ''
  });

  const statTypes = [
    { value: 'kills', label: 'Kills/Eliminations', icon: '🎯' },
    { value: 'deaths', label: 'Deaths', icon: '💀' },
    { value: 'kd_ratio', label: 'K/D Ratio', icon: '⚖️' },
    { value: 'score', label: 'Score/Points', icon: '📊' },
    { value: 'placement', label: 'Final Placement', icon: '🏆' },
    { value: 'damage', label: 'Damage Dealt', icon: '💥' },
    { value: 'custom', label: 'Custom Stat', icon: '🔧' }
  ];

  const comparisonTypes = [
    { value: 'highest', label: 'Highest Value Wins' },
    { value: 'lowest', label: 'Lowest Value Wins' },
    { value: 'greater_than', label: 'Greater Than Target' },
    { value: 'less_than', label: 'Less Than Target' },
    { value: 'equals', label: 'Exactly Equals Target' }
  ];

  const addCriteria = () => {
    if (newCriteria.type && newCriteria.comparison) {
      onStatCriteriaChange([...statCriteria, { ...newCriteria, description: newCriteria.description || getDefaultDescription(newCriteria) }]);
      setNewCriteria({
        type: 'kills',
        comparison: 'highest',
        description: ''
      });
    }
  };

  const removeCriteria = (index: number) => {
    onStatCriteriaChange(statCriteria.filter((_, i) => i !== index));
  };

  const getDefaultDescription = (criteria: StatCriteria) => {
    const statLabel = statTypes.find(s => s.value === criteria.type)?.label || criteria.type;
    const compLabel = comparisonTypes.find(c => c.value === criteria.comparison)?.label || criteria.comparison;
    
    if (criteria.target_value) {
      return `${statLabel} ${compLabel.toLowerCase().replace('target', criteria.target_value.toString())}`;
    }
    return `${statLabel} - ${compLabel}`;
  };

  return (
    <div className="space-y-6">
      {/* Lobby Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lobby Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lobbyId">Lobby/Match ID</Label>
            <Input
              id="lobbyId"
              value={lobbyId}
              onChange={(e) => onLobbyIdChange(e.target.value)}
              placeholder="Enter lobby or match ID"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Both players must join the same lobby/match using this ID
            </p>
          </div>

          <div>
            <Label>Team Preference</Label>
            <RadioGroup 
              value={teamPreference} 
              onValueChange={(value: 'same' | 'opposite' | 'any') => onTeamPreferenceChange(value)}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="same" id="same" />
                <Label htmlFor="same" className="text-sm">Same Team</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="opposite" id="opposite" />
                <Label htmlFor="opposite" className="text-sm">Opposite Teams</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any" className="text-sm">Any Team</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Stat Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Competition Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Criteria */}
          {statCriteria.length > 0 && (
            <div className="space-y-2">
              <Label>Active Criteria:</Label>
              {statCriteria.map((criteria, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {statTypes.find(s => s.value === criteria.type)?.icon} {statTypes.find(s => s.value === criteria.type)?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {criteria.description || getDefaultDescription(criteria)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCriteria(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Add New Criteria */}
          <div className="space-y-4 p-4 border rounded-lg bg-background">
            <Label className="text-sm font-medium">Add Competition Criteria:</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="statType">Stat Type</Label>
                <Select
                  value={newCriteria.type}
                  onValueChange={(value: any) => setNewCriteria(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statTypes.map(stat => (
                      <SelectItem key={stat.value} value={stat.value}>
                        {stat.icon} {stat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comparison">Win Condition</Label>
                <Select
                  value={newCriteria.comparison}
                  onValueChange={(value: any) => setNewCriteria(prev => ({ ...prev, comparison: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonTypes.map(comp => (
                      <SelectItem key={comp.value} value={comp.value}>
                        {comp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newCriteria.comparison === 'greater_than' || newCriteria.comparison === 'less_than' || newCriteria.comparison === 'equals') && (
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={newCriteria.target_value || ''}
                  onChange={(e) => setNewCriteria(prev => ({ ...prev, target_value: Number(e.target.value) }))}
                  placeholder="Enter target value"
                />
              </div>
            )}

            <div>
              <Label htmlFor="description">Custom Description (Optional)</Label>
              <Input
                id="description"
                value={newCriteria.description}
                onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Custom description for this criteria"
              />
            </div>

            <Button onClick={addCriteria} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Criteria
            </Button>
          </div>

          {statCriteria.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Add at least one criteria to determine the winner</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
