import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Target } from 'lucide-react';
import { StatCriteria } from '@/types/wager';

interface StatCriteriaBuilderProps {
  criteria: StatCriteria[];
  onCriteriaChange: (criteria: StatCriteria[]) => void;
}

export const StatCriteriaBuilder = ({ criteria, onCriteriaChange }: StatCriteriaBuilderProps) => {
  const [newCriteria, setNewCriteria] = useState<StatCriteria>({
    type: 'kills',
    comparison: 'greater_than',
    target_value: 0,
    description: ''
  });

  const statTypes = [
    { value: 'kills', label: 'Kills' },
    { value: 'deaths', label: 'Deaths' },
    { value: 'kd_ratio', label: 'K/D Ratio' },
    { value: 'score', label: 'Score' },
    { value: 'placement', label: 'Placement' },
    { value: 'damage', label: 'Damage Dealt' },
    { value: 'custom', label: 'Custom Stat' }
  ];

  const comparisonTypes = [
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'equals', label: 'Equals' },
    { value: 'highest', label: 'Highest among players' },
    { value: 'lowest', label: 'Lowest among players' }
  ];

  const addCriteria = () => {
    if (!newCriteria.target_value && !['highest', 'lowest'].includes(newCriteria.comparison)) {
      return;
    }
    
    onCriteriaChange([...criteria, { ...newCriteria }]);
    setNewCriteria({
      type: 'kills',
      comparison: 'greater_than',
      target_value: 0,
      description: ''
    });
  };

  const removeCriteria = (index: number) => {
    onCriteriaChange(criteria.filter((_, i) => i !== index));
  };

  const formatCriteriaText = (stat: StatCriteria) => {
    const statLabel = statTypes.find(s => s.value === stat.type)?.label || stat.type;
    const compLabel = comparisonTypes.find(c => c.value === stat.comparison)?.label || stat.comparison;
    
    if (['highest', 'lowest'].includes(stat.comparison)) {
      return `${compLabel} ${statLabel.toLowerCase()}`;
    }
    
    return `${statLabel} ${compLabel.toLowerCase()} ${stat.target_value}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          Performance Criteria
        </Label>
        <p className="text-sm text-muted-foreground">Define what performance metrics determine the winner</p>
      </div>

      {/* Existing Criteria */}
      {criteria.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Criteria:</Label>
          <div className="flex flex-wrap gap-2">
            {criteria.map((stat, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-2">
                {formatCriteriaText(stat)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeCriteria(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add New Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Performance Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Stat Type</Label>
              <Select value={newCriteria.type} onValueChange={(value: any) => 
                setNewCriteria({ ...newCriteria, type: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Comparison</Label>
              <Select value={newCriteria.comparison} onValueChange={(value: any) => 
                setNewCriteria({ ...newCriteria, comparison: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {comparisonTypes.map((comp) => (
                    <SelectItem key={comp.value} value={comp.value}>
                      {comp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!['highest', 'lowest'].includes(newCriteria.comparison) && (
            <div>
              <Label className="text-sm">Target Value</Label>
              <Input
                type="number"
                value={newCriteria.target_value || ''}
                onChange={(e) => setNewCriteria({ 
                  ...newCriteria, 
                  target_value: parseFloat(e.target.value) || 0 
                })}
                placeholder="Enter target value"
              />
            </div>
          )}

          <div>
            <Label className="text-sm">Description (Optional)</Label>
            <Textarea
              value={newCriteria.description || ''}
              onChange={(e) => setNewCriteria({ 
                ...newCriteria, 
                description: e.target.value 
              })}
              placeholder="Describe this criteria..."
              rows={2}
            />
          </div>

          <Button 
            type="button" 
            onClick={addCriteria} 
            className="w-full"
            disabled={!newCriteria.target_value && !['highest', 'lowest'].includes(newCriteria.comparison)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Criteria
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
