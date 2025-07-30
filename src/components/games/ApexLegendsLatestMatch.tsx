import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Target, Skull, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApexMatchData {
  gamertag: string;
  platform: string;
  legend: string;
  kills: number;
  damage: number;
  placement: number;
  trackerScore: number;
  lastUpdated: string;
}

export const ApexLegendsLatestMatch = () => {
  const [gamertag, setGamertag] = useState('');
  const [platform, setPlatform] = useState('PC');
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState<ApexMatchData | null>(null);
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
      const { data, error } = await supabase.functions.invoke('apex-legends-stats', {
        body: { 
          gamertag: gamertag.trim(),
          platform: platform.toLowerCase()
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
      console.error('Error fetching Apex match:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch latest match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'pc': return 'bg-blue-500';
      case 'xbox': return 'bg-green-500';
      case 'playstation': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Apex Legends Latest Match
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
            <option value="PC">PC</option>
            <option value="Xbox">Xbox</option>
            <option value="PlayStation">PlayStation</option>
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
              <Badge className={getPlatformColor(matchData.platform)}>
                {matchData.platform}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Legend:</span>
              <span className="text-sm">{matchData.legend}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">{matchData.kills}</div>
                <div className="text-xs text-muted-foreground">Kills</div>
              </div>

              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-lg font-bold text-orange-600">{matchData.damage}</div>
                <div className="text-xs text-muted-foreground">Damage</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Placement:</span>
              <Badge variant={matchData.placement <= 3 ? "default" : "secondary"}>
                #{matchData.placement}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score:</span>
              <Badge variant="outline">{matchData.trackerScore}</Badge>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2">
              Last updated: {new Date(matchData.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};