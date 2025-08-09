import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Camera,
  Gamepad2
} from 'lucide-react';

interface COD6Stats {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  score: number;
  placement: number;
  match_duration: number;
  game_mode: string;
  map: string;
}

interface ConfidenceMetrics {
  score: number; // 0-100
  factors: {
    api_response_complete: boolean;
    stats_realistic: boolean;
    timing_consistent: boolean;
    platform_verified: boolean;
  };
  recommendation: 'accept' | 'manual_review' | 'reject';
  fallback_required: boolean;
}

interface COD6ResultsAdapterProps {
  matchId: string;
  playerId: string;
  onStatsProcessed: (stats: COD6Stats, confidence: ConfidenceMetrics) => void;
}

export const COD6ResultsAdapter = ({ 
  matchId, 
  playerId, 
  onStatsProcessed 
}: COD6ResultsAdapterProps) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<COD6Stats | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceMetrics | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const { toast } = useToast();

  const fetchCOD6Stats = async () => {
    setLoading(true);
    try {
      console.log('Fetching COD6 stats for player:', playerId);
      
      // Call the COD multiplayer stats edge function
      const { data, error } = await supabase.functions.invoke('cod-multiplayer-stats', {
        body: { 
          playerId,
          matchId,
          platform: 'xbox' // Default to Xbox for now
        }
      });

      if (error) {
        console.error('COD6 API Error:', error);
        throw error;
      }

      console.log('Raw COD6 API Response:', data);

      // Parse and validate the stats
      const parsedStats: COD6Stats = {
        kills: data?.stats?.kills || 0,
        deaths: Math.max(data?.stats?.deaths || 1, 1), // Prevent division by zero
        assists: data?.stats?.assists || 0,
        damage: data?.stats?.damage || 0,
        score: data?.stats?.score || 0,
        placement: data?.stats?.placement || 99,
        match_duration: data?.match_duration || 600, // 10 minutes default
        game_mode: data?.game_mode || 'unknown',
        map: data?.map || 'unknown',
      };

      // Calculate confidence score
      const confidenceMetrics = calculateConfidenceScore(parsedStats, data);
      
      setStats(parsedStats);
      setConfidence(confidenceMetrics);

      // Log confidence score for analytics
      await logConfidenceScore(matchId, playerId, confidenceMetrics);

      // Check if fallback to screenshot is required
      if (confidenceMetrics.fallback_required) {
        setFallbackMode(true);
        toast({
          title: "Manual Verification Required",
          description: `Confidence score: ${confidenceMetrics.score}%. Please provide screenshot proof.`,
          variant: "destructive",
        });
      } else {
        onStatsProcessed(parsedStats, confidenceMetrics);
        toast({
          title: "Stats Retrieved",
          description: `COD6 stats pulled successfully. Confidence: ${confidenceMetrics.score}%`,
        });
      }

    } catch (error) {
      console.error('Error fetching COD6 stats:', error);
      
      // Fallback to manual screenshot submission
      setFallbackMode(true);
      toast({
        title: "API Unavailable",
        description: "Falling back to screenshot verification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateConfidenceScore = (stats: COD6Stats, rawData: any): ConfidenceMetrics => {
    const factors = {
      api_response_complete: !!(rawData?.stats && rawData?.match_duration),
      stats_realistic: validateStatsRealistic(stats),
      timing_consistent: validateTimingConsistent(stats, rawData),
      platform_verified: !!(rawData?.platform_verified),
    };

    // Calculate score based on factors
    let score = 0;
    if (factors.api_response_complete) score += 30;
    if (factors.stats_realistic) score += 25;
    if (factors.timing_consistent) score += 25;
    if (factors.platform_verified) score += 20;

    // Determine recommendation
    let recommendation: 'accept' | 'manual_review' | 'reject' = 'accept';
    let fallback_required = false;

    if (score < 50) {
      recommendation = 'reject';
      fallback_required = true;
    } else if (score < 75) {
      recommendation = 'manual_review';
      fallback_required = true;
    }

    return {
      score,
      factors,
      recommendation,
      fallback_required,
    };
  };

  const validateStatsRealistic = (stats: COD6Stats): boolean => {
    const kd = stats.kills / stats.deaths;
    
    // Flag unrealistic stats
    if (kd > 10 && stats.kills > 20) return false; // Impossible K/D
    if (stats.damage < stats.kills * 50) return false; // Too little damage per kill
    if (stats.score < stats.kills * 10) return false; // Too low score
    if (stats.kills > 100) return false; // Impossible kill count for most modes
    
    return true;
  };

  const validateTimingConsistent = (stats: COD6Stats, rawData: any): boolean => {
    const matchDuration = rawData?.match_duration || 600;
    
    // Check if kills/minute is reasonable (max ~2 kills per minute for aggressive play)
    const killsPerMinute = (stats.kills / matchDuration) * 60;
    if (killsPerMinute > 3) return false;
    
    // Very short matches with high stats are suspicious
    if (matchDuration < 180 && stats.kills > 15) return false;
    
    return true;
  };

  const logConfidenceScore = async (matchId: string, playerId: string, confidence: ConfidenceMetrics) => {
    try {
      await supabase
        .from('api_verification_stats')
        .insert({
          game_name: 'COD6',
          verification_count: 1,
          automated_verifications: confidence.fallback_required ? 0 : 1,
          manual_verifications: confidence.fallback_required ? 1 : 0,
          revenue_generated: 0, // Will be updated when match completes
          cost_savings: confidence.fallback_required ? 0 : 2.50, // Estimated manual verification cost
        });

      // Log detailed confidence data
      await supabase
        .from('market_events')
        .insert({
          event_type: 'cod6_confidence_score',
          details: {
            match_id: matchId,
            player_id: playerId,
            confidence_score: confidence.score,
            factors: confidence.factors,
            recommendation: confidence.recommendation,
            fallback_required: confidence.fallback_required,
          },
        });

    } catch (error) {
      console.error('Error logging confidence score:', error);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'accept': return <Badge className="bg-green-100 text-green-800">Auto Accept</Badge>;
      case 'manual_review': return <Badge className="bg-yellow-100 text-yellow-800">Manual Review</Badge>;
      case 'reject': return <Badge className="bg-red-100 text-red-800">Screenshot Required</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          COD6 Results Adapter v1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stats && !loading && (
          <Button 
            onClick={fetchCOD6Stats}
            className="w-full"
            disabled={loading}
          >
            <Target className="h-4 w-4 mr-2" />
            Fetch Real COD6 Stats
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Pulling stats from COD API...</span>
          </div>
        )}

        {stats && confidence && (
          <div className="space-y-4">
            {/* Confidence Score */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Confidence Analysis
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getConfidenceColor(confidence.score)}`}>
                    {confidence.score}%
                  </span>
                  {getConfidenceBadge(confidence.recommendation)}
                </div>
              </div>

              {/* Confidence Factors */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {confidence.factors.api_response_complete ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> :
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  }
                  <span>API Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  {confidence.factors.stats_realistic ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> :
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  }
                  <span>Stats Realistic</span>
                </div>
                <div className="flex items-center gap-2">
                  {confidence.factors.timing_consistent ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> :
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  }
                  <span>Timing Valid</span>
                </div>
                <div className="flex items-center gap-2">
                  {confidence.factors.platform_verified ? 
                    <CheckCircle className="h-3 w-3 text-green-500" /> :
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  }
                  <span>Platform Verified</span>
                </div>
              </div>
            </div>

            {/* Stats Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-2 border rounded">
                <p className="text-2xl font-bold text-green-600">{stats.kills}</p>
                <p className="text-xs text-muted-foreground">Kills</p>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="text-2xl font-bold text-red-600">{stats.deaths}</p>
                <p className="text-xs text-muted-foreground">Deaths</p>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="text-2xl font-bold text-blue-600">{stats.assists}</p>
                <p className="text-xs text-muted-foreground">Assists</p>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="text-2xl font-bold">{(stats.kills / stats.deaths).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">K/D</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="text-sm space-y-1 p-2 bg-muted rounded">
              <p><strong>Score:</strong> {stats.score.toLocaleString()}</p>
              <p><strong>Damage:</strong> {stats.damage.toLocaleString()}</p>
              <p><strong>Placement:</strong> #{stats.placement}</p>
              <p><strong>Mode:</strong> {stats.game_mode}</p>
              <p><strong>Map:</strong> {stats.map}</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <strong>Duration:</strong> {Math.floor(stats.match_duration / 60)}m {stats.match_duration % 60}s
              </p>
            </div>
          </div>
        )}

        {fallbackMode && (
          <Alert className="border-orange-200 bg-orange-50">
            <Camera className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Screenshot Verification Required</p>
                <p className="text-sm">
                  {confidence ? 
                    `Confidence score too low (${confidence.score}%). Please provide screenshot proof.` :
                    'API unavailable. Manual verification required.'
                  }
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};