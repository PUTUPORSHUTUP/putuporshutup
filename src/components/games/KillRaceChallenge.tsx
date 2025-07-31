import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sword, Trophy, Target, Clock, Gamepad2, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface KillRaceChallengeProps {
  onChallengeCreate?: (challengeData: any) => void;
  gameId?: string;
}

interface CODStats {
  username: string;
  platform: string;
  overallStats: {
    kills: number;
    kdRatio: number;
    wins: number;
    gamesPlayed: number;
  };
  recentMatches: any[];
}

export const KillRaceChallenge = ({ onChallengeCreate, gameId }: KillRaceChallengeProps) => {
  const [killTarget, setKillTarget] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [gameMode, setGameMode] = useState('team_deathmatch');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [userStats, setUserStats] = useState<CODStats | null>(null);
  const [hasXboxLink, setHasXboxLink] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user's Xbox status and COD stats on mount
  useEffect(() => {
    if (user) {
      checkXboxStatus();
    }
  }, [user]);

  const checkXboxStatus = async () => {
    if (!user) return;

    try {
      // Check if user has Xbox linked
      const { data: profile } = await supabase
        .from('profiles')
        .select('xbox_gamertag, xbox_xuid')
        .eq('user_id', user.id)
        .single();

      const hasXbox = !!(profile?.xbox_xuid && profile?.xbox_gamertag);
      setHasXboxLink(hasXbox);

      if (hasXbox) {
        await loadUserCODStats(profile.xbox_gamertag);
      }
    } catch (error) {
      console.error('Error checking Xbox status:', error);
    }
  };

  const loadUserCODStats = async (gamertag: string) => {
    try {
      setIsLoadingStats(true);

      // Fetch COD multiplayer stats
      const { data, error } = await supabase.functions.invoke('cod-multiplayer-stats', {
        body: {
          user_id: user?.id,
          username: gamertag,
          platform: 'xbox'
        }
      });

      if (error) throw error;

      if (data?.success) {
        setUserStats(data.data);
      }

    } catch (error) {
      console.error('Error loading COD stats:', error);
      // Don't show error toast as stats are optional
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create challenges",
        variant: "destructive"
      });
      return;
    }

    if (!hasXboxLink) {
      toast({
        title: "Xbox Required",
        description: "Link your Xbox account to create kill race challenges",
        variant: "destructive"
      });
      return;
    }

    const challengeData = {
      type: 'kill_race',
      challenge_type: '1v1',
      game_mode: gameMode,
      platform: 'xbox',
      killTarget,
      timeLimit,
      stakeAmount,
      verificationMethod: 'api_automatic',
      stat_criteria: {
        kill_target: killTarget,
        time_limit_minutes: timeLimit,
        game_mode: gameMode,
        platform: 'xbox'
      }
    };

    onChallengeCreate?.(challengeData);
    
    toast({
      title: "Kill Race Challenge Created!",
      description: `First to ${killTarget} kills in ${gameMode} wins $${stakeAmount}`,
    });
  };

  const getKDColor = (kd: number) => {
    if (kd >= 2.0) return 'text-green-500';
    if (kd >= 1.5) return 'text-yellow-500';
    if (kd >= 1.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const formatGameMode = (mode: string) => {
    return mode.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword className="w-5 h-5" />
          COD Kill Race Challenge
          {hasXboxLink && <Shield className="w-4 h-4 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Xbox Status & User Stats */}
        {!hasXboxLink ? (
          <div className="bg-destructive/10 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              Xbox account required for kill races
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Link your Xbox gamertag in profile settings
            </p>
          </div>
        ) : isLoadingStats ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Loading COD stats...</span>
          </div>
        ) : userStats ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              {userStats.username} Stats
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Kills: {userStats.overallStats.kills.toLocaleString()}</div>
              <div className={getKDColor(userStats.overallStats.kdRatio)}>
                K/D: {userStats.overallStats.kdRatio.toFixed(2)}
              </div>
              <div>Wins: {userStats.overallStats.wins.toLocaleString()}</div>
              <div>Games: {userStats.overallStats.gamesPlayed.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Xbox linked but COD stats unavailable
            </p>
          </div>
        )}

        {/* Game Mode Selection */}
        <div className="space-y-2">
          <Label>Game Mode</Label>
          <Select value={gameMode} onValueChange={setGameMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team_deathmatch">Team Deathmatch</SelectItem>
              <SelectItem value="domination">Domination</SelectItem>
              <SelectItem value="hardpoint">Hardpoint</SelectItem>
              <SelectItem value="search_and_destroy">Search & Destroy</SelectItem>
              <SelectItem value="free_for_all">Free For All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kill Target */}
        <div className="space-y-2">
          <Label htmlFor="kill-target">Kill Target</Label>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <Input
              id="kill-target"
              type="number"
              value={killTarget}
              onChange={(e) => setKillTarget(Number(e.target.value))}
              min="10"
              max="50"
              step="5"
            />
          </div>
        </div>

        {/* Time Limit */}
        <div className="space-y-2">
          <Label htmlFor="time-limit">Time Limit (minutes)</Label>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <Input
              id="time-limit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              min="15"
              max="45"
              step="5"
            />
          </div>
        </div>

        {/* Stake Amount */}
        <div className="space-y-2">
          <Label htmlFor="stake-amount">Stake Amount ($)</Label>
          <Input
            id="stake-amount"
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            min="5"
            max="100"
            step="5"
          />
        </div>

        {/* Challenge Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Prize Pool</span>
            <Badge variant="secondary">${stakeAmount * 2}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Mode</span>
            <Badge variant="outline">{formatGameMode(gameMode)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Platform</span>
            <Badge variant="outline">Xbox</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Verification</span>
            <Badge variant="outline">API Auto-Verify</Badge>
          </div>
        </div>

        <Button 
          onClick={handleCreateChallenge} 
          className="w-full"
          disabled={!hasXboxLink || isLoadingStats}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Create Kill Race Challenge
        </Button>
      </CardContent>
    </Card>
  );
};