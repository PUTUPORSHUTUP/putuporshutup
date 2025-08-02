import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Target, Skull } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CODMatchData {
  username: string;
  platform: string;
  overallStats: {
    kills: number;
    deaths: number;
    kdRatio: number;
    wins: number;
    gamesPlayed: number;
  };
  recentMatches: any[];
  isFallback?: boolean;
  lastUpdated: string;
}

export const CODLatestMatch = () => {
  const [gamertag, setGamertag] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState<CODMatchData | null>(null);
  const { toast } = useToast();

  const fetchLatestMatch = async () => {
    if (!gamertag.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gamertag",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cod-multiplayer-stats', {
        body: { 
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for testing
          username: gamertag.trim(),
          platform: 'xbox'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setMatchData(data.data);
        const statusMsg = data.data.isFallback 
          ? `Showing cached data for ${gamertag} (API temporarily unavailable)`
          : `Latest stats fetched for ${gamertag}`;
        
        toast({
          title: data.data.isFallback ? "Using Cached Data" : "Success",
          description: statusMsg,
          variant: data.data.isFallback ? "default" : "default",
        });
      } else {
        throw new Error(data?.error || 'Failed to fetch match data');
      }
    } catch (error) {
      console.error('Error fetching COD match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch latest match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          COD Latest Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Xbox Gamertag"
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLatestMatch()}
            autoComplete="off"
          />
          <Button 
            onClick={fetchLatestMatch} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Fetch'
            )}
          </Button>
        </div>

        {matchData && (
          <div className="space-y-3 mt-4">
            {matchData.isFallback && (
              <Badge variant="outline" className="w-full justify-center mb-2">
                📡 Using Cached Data
              </Badge>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Player:</span>
              <Badge variant="secondary">{matchData.username}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform:</span>
              <span className="text-sm capitalize">{matchData.platform}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">{matchData.overallStats.kills}</div>
                <div className="text-xs text-muted-foreground">Total Kills</div>
              </div>

              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Skull className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-lg font-bold text-red-600">{matchData.overallStats.deaths}</div>
                <div className="text-xs text-muted-foreground">Total Deaths</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">K/D Ratio:</span>
              <Badge variant={matchData.overallStats.kdRatio >= 1 ? "default" : "secondary"}>
                {matchData.overallStats.kdRatio.toFixed(2)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Wins:</span>
              <span className="text-sm font-semibold text-green-600">{matchData.overallStats.wins}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Games Played:</span>
              <span className="text-sm">{matchData.overallStats.gamesPlayed}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(matchData.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};