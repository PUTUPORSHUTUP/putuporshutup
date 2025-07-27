import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, TrendingUp, Award, Clock, Camera, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StatCriteria {
  type: string;
  target_value?: number;
  comparison: string;
  description?: string;
}

interface WagerStats {
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  placement?: number;
  damage_dealt: number;
  custom_stats?: Record<string, any>;
}

interface StatInputDashboardProps {
  wagerId: string;
  statCriteria: StatCriteria[];
  currentUserId: string;
  verificationMethod: string;
  onStatsSubmitted: () => void;
}

export const StatInputDashboard = ({ 
  wagerId, 
  statCriteria, 
  currentUserId, 
  verificationMethod,
  onStatsSubmitted 
}: StatInputDashboardProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<WagerStats>({
    kills: 0,
    deaths: 0,
    assists: 0,
    score: 0,
    placement: undefined,
    damage_dealt: 0,
    custom_stats: {}
  });
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleStatChange = (field: keyof WagerStats, value: number) => {
    setStats(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomStatChange = (statType: string, value: number) => {
    setStats(prev => ({
      ...prev,
      custom_stats: {
        ...prev.custom_stats,
        [statType]: value
      }
    }));
  };

  const calculateProgress = (criteria: StatCriteria) => {
    const currentValue = getCurrentStatValue(criteria.type);
    if (!criteria.target_value) return 100;
    
    const progress = (currentValue / criteria.target_value) * 100;
    return Math.min(progress, 100);
  };

  const getCurrentStatValue = (statType: string): number => {
    switch (statType) {
      case 'kills': return stats.kills;
      case 'deaths': return stats.deaths;
      case 'assists': return stats.assists;
      case 'score': return stats.score;
      case 'placement': return stats.placement || 0;
      case 'damage': return stats.damage_dealt;
      case 'kd_ratio': return stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
      default: return stats.custom_stats?.[statType] || 0;
    }
  };

  const checkCriteriaCompletion = (criteria: StatCriteria): boolean => {
    const currentValue = getCurrentStatValue(criteria.type);
    
    switch (criteria.comparison) {
      case 'greater_than':
        return currentValue > (criteria.target_value || 0);
      case 'less_than':
        return currentValue < (criteria.target_value || Infinity);
      case 'equals':
        return currentValue === (criteria.target_value || 0);
      default:
        return false;
    }
  };

  const handleSubmitStats = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('challenge_stats')
        .insert({
          challenge_id: wagerId,
          user_id: currentUserId,
          kills: stats.kills,
          deaths: stats.deaths,
          assists: stats.assists,
          score: stats.score,
          placement: stats.placement,
          damage_dealt: stats.damage_dealt,
          custom_stats: stats.custom_stats,
          proof_url: proofUrl || null,
          verified: verificationMethod === 'api'
        });

      if (error) throw error;

      toast({
        title: "Stats Submitted",
        description: "Your performance stats have been recorded.",
      });

      setOpen(false);
      onStatsSubmitted();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit stats. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completedCriteria = statCriteria.filter(checkCriteriaCompletion).length;
  const totalCriteria = statCriteria.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Target className="w-4 h-4 mr-2" />
          Submit Performance Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Statistics Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Completion</span>
                  <Badge variant={completedCriteria === totalCriteria ? "default" : "outline"}>
                    {completedCriteria}/{totalCriteria} Goals
                  </Badge>
                </div>
                <Progress value={(completedCriteria / totalCriteria) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Basic Stats Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Performance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kills">Kills</Label>
                  <Input
                    id="kills"
                    type="number"
                    min="0"
                    value={stats.kills}
                    onChange={(e) => handleStatChange('kills', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="deaths">Deaths</Label>
                  <Input
                    id="deaths"
                    type="number"
                    min="0"
                    value={stats.deaths}
                    onChange={(e) => handleStatChange('deaths', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="assists">Assists</Label>
                  <Input
                    id="assists"
                    type="number"
                    min="0"
                    value={stats.assists}
                    onChange={(e) => handleStatChange('assists', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    value={stats.score}
                    onChange={(e) => handleStatChange('score', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="placement">Placement (Optional)</Label>
                  <Input
                    id="placement"
                    type="number"
                    min="1"
                    value={stats.placement || ''}
                    onChange={(e) => handleStatChange('placement', parseInt(e.target.value) || undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="damage">Damage Dealt</Label>
                  <Input
                    id="damage"
                    type="number"
                    min="0"
                    value={stats.damage_dealt}
                    onChange={(e) => handleStatChange('damage_dealt', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Calculated Stats Display */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Calculated Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>K/D Ratio:</span>
                    <Badge variant="outline">
                      {stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Eliminations:</span>
                    <Badge variant="outline">
                      {stats.kills + stats.assists}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5" />
                Goal Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statCriteria.map((criteria, index) => {
                const currentValue = getCurrentStatValue(criteria.type);
                const isCompleted = checkCriteriaCompletion(criteria);
                const progress = calculateProgress(criteria);

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium capitalize">{criteria.type.replace('_', ' ')}</span>
                        {criteria.description && (
                          <p className="text-xs text-muted-foreground">{criteria.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {currentValue} / {criteria.target_value || 'Best'}
                        </span>
                        <Badge variant={isCompleted ? "default" : "outline"}>
                          {isCompleted ? "Complete" : "In Progress"}
                        </Badge>
                      </div>
                    </div>
                    {criteria.target_value && (
                      <Progress value={progress} className="h-2" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Proof Upload */}
          {verificationMethod !== 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {verificationMethod === 'screenshot' ? <Camera className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  Proof Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="proofUrl">Proof URL</Label>
                  <Input
                    id="proofUrl"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional context about your performance..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitStats} disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Performance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};