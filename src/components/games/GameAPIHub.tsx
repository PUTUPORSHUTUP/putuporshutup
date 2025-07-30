import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CODLatestMatch } from './CODLatestMatch';
import { ApexLegendsLatestMatch } from './ApexLegendsLatestMatch';
import { RocketLeagueLatestMatch } from './RocketLeagueLatestMatch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Zap, Trophy, Target, Gamepad2, Rocket } from 'lucide-react';

interface GameAPIStatus {
  game: string;
  status: 'active' | 'inactive' | 'error';
  lastCall: string;
  callsToday: number;
  automation: boolean;
}

export const GameAPIHub = () => {
  const [apiStatus, setApiStatus] = useState<GameAPIStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAPIStatus();
    // Update every 30 seconds
    const interval = setInterval(loadAPIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAPIStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_actions')
        .select('automation_type, success, created_at')
        .in('automation_type', ['cod_latest_match', 'apex_legends_stats', 'rocket_league_stats'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading API status:', error);
        return;
      }

      // Process the data to get status for each game
      const statusMap = new Map<string, GameAPIStatus>();
      
      const games = ['cod_latest_match', 'apex_legends_stats', 'rocket_league_stats'];
      
      games.forEach(game => {
        const gameCalls = data?.filter(action => action.automation_type === game) || [];
        const today = new Date().toDateString();
        const callsToday = gameCalls.filter(call => 
          new Date(call.created_at).toDateString() === today
        ).length;
        
        const lastCall = gameCalls[0];
        const displayName = game.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        statusMap.set(game, {
          game: displayName,
          status: lastCall ? (lastCall.success ? 'active' : 'error') : 'inactive',
          lastCall: lastCall ? new Date(lastCall.created_at).toLocaleString() : 'Never',
          callsToday,
          automation: callsToday > 0
        });
      });

      setApiStatus(Array.from(statusMap.values()));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (game: string) => {
    if (game.includes('COD')) return <Target className="w-4 h-4" />;
    if (game.includes('Apex')) return <Trophy className="w-4 h-4" />;
    if (game.includes('Rocket')) return <Rocket className="w-4 h-4" />;
    return <Gamepad2 className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Game API Integration Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))
            ) : (
              apiStatus.map((status) => (
                <Card key={status.game} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status.game)}
                        <span className="font-medium text-sm">{status.game}</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Last Call: {status.lastCall}</div>
                      <div>Today: {status.callsToday} calls</div>
                    </div>
                    {status.automation && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Tabs defaultValue="cod" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cod">Call of Duty</TabsTrigger>
              <TabsTrigger value="apex">Apex Legends</TabsTrigger>
              <TabsTrigger value="rocket">Rocket League</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cod" className="mt-4">
              <CODLatestMatch />
            </TabsContent>
            
            <TabsContent value="apex" className="mt-4">
              <ApexLegendsLatestMatch />
            </TabsContent>
            
            <TabsContent value="rocket" className="mt-4">
              <RocketLeagueLatestMatch />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};