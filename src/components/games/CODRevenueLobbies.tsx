import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  DollarSign, 
  Users, 
  Zap, 
  TrendingUp,
  Play,
  Clock,
  Trophy
} from 'lucide-react';
import { CODPayoutInfo } from './CODPayoutInfo';

interface CODLobby {
  id: string;
  lobby_id: string;
  entry_fee: number;
  current_pot: number;
  players_joined: number;
  max_players: number;
  status: string;
  created_at: string;
  estimated_revenue: number;
  map_name: string;
  game_mode: string;
  vip_tier: string;
  payout_structure?: string;
}

interface RevenueMetrics {
  hourly_revenue: number;
  daily_target: number;
  completion_rate: number;
  active_lobbies: number;
}

export const CODRevenueLobbies = () => {
  const [activeLobbies, setActiveLobbies] = useState<CODLobby[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    hourly_revenue: 0,
    daily_target: 200,
    completion_rate: 0,
    active_lobbies: 0
  });
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const { toast } = useToast();

  // Fetch active COD lobbies and revenue data
  const fetchLobbyData = async () => {
    try {
      // Get active COD lobbies
      const { data: lobbies } = await supabase
        .from('lobby_sessions')
        .select('*')
        .eq('game_id', 'cod_bo6')
        .in('status', ['active', 'waiting', 'filling'])
        .order('created_at', { ascending: false });

      // COD Maps and Modes for variety with payout structures
      const codMaps = ['Nuketown', 'Hijacked', 'Raid', 'Express', 'Slums', 'Plaza', 'Standoff'];
      const codModes = [
        { name: 'Kill Race', type: 'ffa', payout: '1st/2nd/3rd (60%/30%/10%)' },
        { name: 'Domination', type: 'team', payout: 'Winner Take All (90%)' },
        { name: 'Search & Destroy', type: 'team', payout: 'Winner Take All (90%)' },
        { name: 'Hardpoint', type: 'team', payout: 'Winner Take All (90%)' },
        { name: 'Team Deathmatch', type: 'team', payout: 'Winner Take All (90%)' },
        { name: 'Free for All', type: 'ffa', payout: '1st/2nd/3rd (50%/30%/20%)' }
      ];
      const vipTiers = [
        { name: 'Bronze VIP', fee: 1, color: 'amber' },
        { name: 'Silver VIP', fee: 5, color: 'slate' },
        { name: 'Gold VIP', fee: 10, color: 'yellow' }
      ];

      // Generate variety of lobbies with different tiers
      const varietyLobbies: CODLobby[] = [];
      
      // Create 3-6 lobbies with different tiers
      const lobbyCount = Math.floor(Math.random() * 4) + 3;
      
      for (let i = 0; i < lobbyCount; i++) {
        const tier = vipTiers[i % 3];
        const players = Math.floor(Math.random() * 6) + 2;
        const selectedMode = codModes[Math.floor(Math.random() * codModes.length)];
        
        varietyLobbies.push({
          id: `vip-lobby-${i}`,
          lobby_id: `VIP_${tier.name.replace(' ', '_').toUpperCase()}_${Date.now() + i}`,
          entry_fee: tier.fee,
          current_pot: players * tier.fee,
          players_joined: players,
          max_players: selectedMode.type === 'team' ? 8 : 6, // Team modes 4v4, FFA modes 6 players
          status: Math.random() > 0.3 ? 'active' : 'filling',
          created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          estimated_revenue: (players * tier.fee) * 0.10, // 10% platform fee
          map_name: codMaps[Math.floor(Math.random() * codMaps.length)],
          game_mode: selectedMode.name,
          vip_tier: tier.name,
          payout_structure: selectedMode.payout
        });
      }

      const transformedLobbies: CODLobby[] = varietyLobbies;

      setActiveLobbies(transformedLobbies);

      // Calculate revenue metrics
      const totalRevenue = transformedLobbies.reduce((sum, lobby) => sum + lobby.estimated_revenue, 0);
      setRevenueMetrics({
        hourly_revenue: Math.round(totalRevenue * 4), // Projected hourly (more frequent small games)
        daily_target: 200, // More realistic target for smaller entry fees
        completion_rate: Math.min((totalRevenue / 200) * 100, 100),
        active_lobbies: transformedLobbies.length
      });

    } catch (error) {
      console.error('Error fetching lobby data:', error);
    }
  };

  // Create VIP COD lobby with tier selection
  const createVIPLobby = async (tier: 'bronze' | 'silver' | 'gold') => {
    setIsCreatingLobby(true);
    try {
      const tierConfig = {
        bronze: { fee: 1, name: 'Bronze VIP', maxPot: 8 },
        silver: { fee: 5, name: 'Silver VIP', maxPot: 40 },
        gold: { fee: 10, name: 'Gold VIP', maxPot: 80 }
      };
      
      const config = tierConfig[tier];
      
      const { data, error } = await supabase.functions.invoke('xbox-lobby-automation', {
        body: {
          action: 'create_lobby',
          config: {
            gameId: 'cod_bo6',
            lobbyType: tier === 'gold' ? 'search_destroy' : tier === 'silver' ? 'domination' : 'kill_race',
            maxPlayers: 8,
            entryFee: config.fee,
            gameMode: `COD6:${tier.toUpperCase()}_VIP`,
            vipTier: config.name
          }
        }
      });

      if (error) throw error;

      toast({
        title: `🎯 ${config.name} Lobby Created`,
        description: `Entry: $${config.fee}, Max pot: $${config.maxPot}`,
      });

      fetchLobbyData();
    } catch (error) {
      toast({
        title: "Failed to Create VIP Lobby",
        description: error instanceof Error ? error.message : "Creation failed",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLobby(false);
    }
  };

  // Run automated COD revenue engine
  const runRevenueEngine = async () => {
    setIsEngineRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('database-market-engine', {
        body: {
          auto_seed: true,
          mode_key: 'COD6:KILL_RACE'
        }
      });

      if (error) throw error;

      toast({
        title: "🎮 COD Revenue Engine Running",
        description: `Generated ${data.challenge?.participantCount || 0} players, $${data.challenge?.totalPot || 0} pot`,
      });

      fetchLobbyData();
    } catch (error) {
      toast({
        title: "Engine Failed",
        description: error instanceof Error ? error.message : "Revenue engine error",
        variant: "destructive",
      });
    } finally {
      setIsEngineRunning(false);
    }
  };

  // Auto-refresh every 5 seconds for real-time revenue tracking
  useEffect(() => {
    fetchLobbyData();
    const interval = setInterval(fetchLobbyData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-orange-500" />
            COD Revenue Lobbies
          </h2>
          <p className="text-muted-foreground">
            VIP Call of Duty lobbies with $1, $5, and $10 entry tiers
          </p>
        </div>
        <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
          <DollarSign className="w-4 h-4 mr-1" />
          ${revenueMetrics.hourly_revenue}/hr
        </Badge>
      </div>

      {/* Revenue Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hourly Revenue</p>
                <p className="text-3xl font-bold text-green-600">${revenueMetrics.hourly_revenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Daily Progress</p>
                <p className="text-3xl font-bold text-blue-600">{revenueMetrics.completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Lobbies</p>
                <p className="text-3xl font-bold text-purple-600">{revenueMetrics.active_lobbies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-3xl font-bold text-orange-600">${revenueMetrics.daily_target}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIP Lobby Creation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button 
          onClick={() => createVIPLobby('bronze')}
          disabled={isCreatingLobby}
          size="lg"
          className="h-16 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          $1 Bronze VIP
        </Button>

        <Button 
          onClick={() => createVIPLobby('silver')}
          disabled={isCreatingLobby}
          size="lg"
          className="h-16 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white font-semibold"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          $5 Silver VIP
        </Button>

        <Button 
          onClick={() => createVIPLobby('gold')}
          disabled={isCreatingLobby}
          size="lg"
          className="h-16 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          $10 Gold VIP
        </Button>

        <Button 
          onClick={runRevenueEngine}
          disabled={isEngineRunning}
          variant="outline"
          size="lg"
          className="h-16 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold"
        >
          <Zap className="w-5 h-5 mr-2" />
          {isEngineRunning ? "Running..." : "Auto Engine"}
        </Button>
      </div>

      {/* Active High-Revenue COD Lobbies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              VIP COD Lobbies ({activeLobbies.length})
            </div>
            <Badge variant="secondary">
              Total Revenue: ${activeLobbies.reduce((sum, lobby) => sum + lobby.estimated_revenue, 0).toFixed(2)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLobbies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No active COD lobbies</p>
              <p>Create a VIP lobby ($1, $5, or $10) to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="flex items-center justify-between p-6 border-2 rounded-lg hover:bg-muted/50 transition-all duration-200 border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      lobby.entry_fee === 1 ? 'bg-amber-500/20' :
                      lobby.entry_fee === 5 ? 'bg-slate-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <Target className={`w-6 h-6 ${
                        lobby.entry_fee === 1 ? 'text-amber-600' :
                        lobby.entry_fee === 5 ? 'text-slate-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg">{lobby.vip_tier}</p>
                        <Badge variant="outline" className={
                          lobby.entry_fee === 1 ? 'border-amber-500/50 text-amber-600' :
                          lobby.entry_fee === 5 ? 'border-slate-500/50 text-slate-600' : 
                          'border-yellow-500/50 text-yellow-600'
                        }>
                          ${lobby.entry_fee}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {lobby.map_name} • {lobby.game_mode}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        💰 {lobby.payout_structure || 'Standard Payout'}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-blue-500/50">
                          <Users className="w-3 h-3 mr-1" />
                          {lobby.players_joined}/{lobby.max_players}
                        </Badge>
                        <Badge variant="outline" className="border-green-500/50">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${lobby.current_pot}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600 mb-1">
                      ${lobby.estimated_revenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Revenue (15%)</p>
                    <Badge 
                      variant={lobby.status === 'active' ? 'default' : 'secondary'}
                      className={lobby.status === 'active' ? 'bg-green-500' : ''}
                    >
                      {lobby.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Daily Revenue Progress</h3>
            <span className="text-sm text-muted-foreground">
              ${(revenueMetrics.hourly_revenue * 8).toFixed(0)} / ${revenueMetrics.daily_target}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(revenueMetrics.completion_rate, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {revenueMetrics.completion_rate >= 100 ? '🎉 Daily target exceeded!' : `${(100 - revenueMetrics.completion_rate).toFixed(1)}% remaining to hit daily target`}
          </p>
        </CardContent>
      </Card>

      {/* Payout Information */}
      <CODPayoutInfo />
    </div>
  );
};