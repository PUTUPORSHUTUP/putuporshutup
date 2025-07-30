import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Target, Skull } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CODMatchData {
  gamertag: string;
  platform: string;
  mode: string;
  kills: number;
  deaths: number;
  kdRatio: number;
  matchDate: number;
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
      const { data, error } = await supabase.functions.invoke('cod-latest-match', {
        body: { gamertag: gamertag.trim() }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setMatchData(data.data);
        toast({
          title: "Success",
          description: `Latest match data fetched for ${gamertag}`,
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
            onKeyPress={(e) => e.key === 'Enter' && fetchLatestMatch()}
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Player:</span>
              <Badge variant="secondary">{matchData.gamertag}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode:</span>
              <span className="text-sm">{matchData.mode}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">{matchData.kills}</div>
                <div className="text-xs text-muted-foreground">Kills</div>
              </div>

              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Skull className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-lg font-bold text-red-600">{matchData.deaths}</div>
                <div className="text-xs text-muted-foreground">Deaths</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">K/D Ratio:</span>
              <Badge variant={matchData.kdRatio >= 1 ? "default" : "secondary"}>
                {matchData.kdRatio.toFixed(2)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(matchData.matchDate)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};