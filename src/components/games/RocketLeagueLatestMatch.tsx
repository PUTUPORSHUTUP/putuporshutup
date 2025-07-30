import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Rocket, Target, Trophy, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RocketLeagueMatchData {
  gamertag: string;
  platform: string;
  playlist: string;
  score: number;
  goals: number;
  saves: number;
  assists: number;
  mvp: boolean;
  result: 'win' | 'loss';
  lastUpdated: string;
}

export const RocketLeagueLatestMatch = () => {
  const [gamertag, setGamertag] = useState('');
  const [platform, setPlatform] = useState('steam');
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState<RocketLeagueMatchData | null>(null);
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
      const { data, error } = await supabase.functions.invoke('rocket-league-stats', {
        body: { 
          gamertag: gamertag.trim(),
          platform: platform
        }
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
      console.error('Error fetching Rocket League match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch latest match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'steam': return '🖥️';
      case 'xbox': return '🎮';
      case 'playstation': return '🎮';
      case 'epic': return '🎮';
      default: return '🎮';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Rocket League Latest Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Gamertag"
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchLatestMatch()}
            className="flex-1"
          />
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="steam">Steam</option>
            <option value="xbox">Xbox</option>
            <option value="playstation">PlayStation</option>
            <option value="epic">Epic Games</option>
          </select>
        </div>
        
        <Button 
          onClick={fetchLatestMatch} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Fetch Latest Match'
          )}
        </Button>

        {matchData && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Player:</span>
              <Badge variant="secondary">{matchData.gamertag}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform:</span>
              <Badge variant="outline">
                {getPlatformIcon(matchData.platform)} {matchData.platform}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Playlist:</span>
              <span className="text-sm">{matchData.playlist}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-sm font-bold text-blue-600">{matchData.goals}</div>
                <div className="text-xs text-muted-foreground">Goals</div>
              </div>

              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm font-bold text-green-600">{matchData.saves}</div>
                <div className="text-xs text-muted-foreground">Saves</div>
              </div>

              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-sm font-bold text-purple-600">{matchData.assists}</div>
                <div className="text-xs text-muted-foreground">Assists</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score:</span>
              <Badge variant="outline">{matchData.score}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Result:</span>
              <Badge variant={matchData.result === 'win' ? "default" : "secondary"}>
                {matchData.result === 'win' ? '🏆 Win' : '💀 Loss'}
              </Badge>
            </div>

            {matchData.mvp && (
              <div className="flex items-center justify-center">
                <Badge className="bg-yellow-500 text-black">
                  <Trophy className="w-3 h-3 mr-1" />
                  MVP
                </Badge>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center pt-2">
              Last updated: {new Date(matchData.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};