import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Trophy, 
  Target,
  Activity,
  RotateCcw
} from 'lucide-react';

interface MatchOutcome {
  id: string;
  challenge_id: string;
  user_id: string;
  result: 'win' | 'loss' | 'draw' | 'pending';
  auto_detected: boolean;
  confidence_score: number;
  verification_status: 'verified' | 'pending' | 'disputed' | 'failed';
  game_name: string;
  created_at: string;
  updated_at: string;
}

export const MatchOutcomeAutomation = () => {
  const [outcomes, setOutcomes] = useState<MatchOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMatchOutcomes();
    
    // Set up real-time subscription for match outcome updates
    const channel = supabase
      .channel('match_outcomes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_stats'
      }, () => {
        loadMatchOutcomes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMatchOutcomes = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_stats')
        .select(`
          *,
          challenges(title, game:games(display_name))
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading match outcomes:', error);
        return;
      }

      // Transform data to match our interface
      const transformedData = data?.map(stat => ({
        id: stat.id,
        challenge_id: stat.challenge_id,
        user_id: stat.user_id,
        result: determineResult(stat),
        auto_detected: stat.verified,
        confidence_score: calculateConfidence(stat),
        verification_status: (stat.verified ? 'verified' : 'pending') as 'verified' | 'pending' | 'disputed' | 'failed',
        game_name: stat.challenges?.game?.display_name || 'Unknown',
        created_at: stat.created_at,
        updated_at: stat.updated_at
      })) || [];

      setOutcomes(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineResult = (stat: any): 'win' | 'loss' | 'draw' | 'pending' => {
    if (!stat.verified) return 'pending';
    
    if (stat.placement === 1) return 'win';
    if (stat.placement > 1 && stat.placement <= 3) return 'loss'; // Could be adjusted
    if (stat.kills > stat.deaths) return 'win';
    if (stat.kills < stat.deaths) return 'loss';
    
    return 'draw';
  };

  const calculateConfidence = (stat: any): number => {
    let confidence = 0;
    
    if (stat.verified) confidence += 40;
    if (stat.proof_url) confidence += 30;
    if (stat.kills && stat.deaths) confidence += 20;
    if (stat.placement) confidence += 10;
    
    return Math.min(confidence, 100);
  };

  const triggerAutomaticProcessing = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-orchestrator', {
        body: { action: 'process_match_outcomes' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Processing Started",
        description: "Automatic match outcome detection is running...",
      });

      setTimeout(() => {
        loadMatchOutcomes();
      }, 3000);

    } catch (error) {
      console.error('Error triggering automation:', error);
      toast({
        title: "Error",
        description: "Failed to start automatic processing",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-600 bg-green-50';
      case 'loss': return 'text-red-600 bg-red-50';
      case 'draw': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Match Outcome Automation
            </CardTitle>
            <Button 
              onClick={triggerAutomaticProcessing}
              disabled={processing}
              variant="outline"
              size="sm"
            >
              {processing ? (
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Auto Process
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {outcomes.filter(o => o.result === 'win').length}
                </div>
                <div className="text-sm text-muted-foreground">Wins Detected</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {outcomes.filter(o => o.result === 'loss').length}
                </div>
                <div className="text-sm text-muted-foreground">Losses Detected</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {outcomes.filter(o => o.auto_detected).length}
                </div>
                <div className="text-sm text-muted-foreground">Auto Verified</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {outcomes.filter(o => o.verification_status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Recent Match Outcomes</h3>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))
            ) : outcomes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No match outcomes found
              </div>
            ) : (
              outcomes.map((outcome) => (
                <Card key={outcome.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getVerificationIcon(outcome.verification_status)}
                        <div>
                          <div className="font-medium">{outcome.game_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(outcome.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getResultColor(outcome.result)}>
                          {outcome.result.toUpperCase()}
                        </Badge>
                        
                        {outcome.auto_detected && (
                          <Badge variant="outline" className="text-blue-600">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {outcome.confidence_score}% confident
                          </div>
                          <Progress 
                            value={outcome.confidence_score} 
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};