import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Sparkles, Clock, Users } from 'lucide-react';

export const TestTournamentAutomation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTournament, setLastTournament] = useState(null);
  const { toast } = useToast();

  const testAutomation = async () => {
    setIsLoading(true);
    try {
      // First, ensure we have tournament templates for automation to work
      const { data: templates } = await supabase
        .from('tournament_templates')
        .select('*')
        .eq('is_active', true);

      if (!templates?.length) {
        // Create a test tournament template
        const { data: games } = await supabase
          .from('games')
          .select('*')
          .limit(1)
          .single();

        if (games) {
          await supabase
            .from('tournament_templates')
            .insert({
              template_name: 'Test Championship Template',
              schedule_cron: '0 */2 * * *', // Every 2 hours
              game_id: games.id,
              max_participants: 8,
              entry_fee: 25,
              collectible_series: 'Elite Gaming Championship',
              poster_title_template: '{series} #{episode}: {variation}',
              title_variations: ['Elite Showdown', 'Pro Championship', 'Masters Cup'],
              cover_art_url: '/placeholder-tournament.jpg',
              is_active: true
            });
        }
      }

      console.log('🎮 Starting automation test...');
      
      // Call the automation orchestrator to create a test tournament
      const { data, error } = await supabase.functions.invoke('automation-orchestrator', {
        body: { test: true }
      });

      console.log('🔄 Automation response:', data, error);

      if (error) {
        throw error;
      }

      // Wait a moment for the tournament to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the latest tournament to show the result
      const { data: latestTournament } = await supabase
        .from('tournaments')
        .select(`
          *,
          games(name, display_name),
          tournament_posters(*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('📋 Latest tournament:', latestTournament);

      if (latestTournament) {
        setLastTournament(latestTournament);
        toast({
          title: "🎉 Collectible Tournament Created!",
          description: `Generated: ${latestTournament.poster_title || latestTournament.title}`,
          duration: 5000,
        });
      } else {
        throw new Error('No tournament was created by automation');
      }

    } catch (error) {
      console.error('❌ Automation test error:', error);
      toast({
        title: "❌ Automation Failed",
        description: error.message || 'Failed to create tournament',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tournament Automation Test
          </CardTitle>
          <CardDescription>
            Test the automated tournament creation with collectible posters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testAutomation} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creating Collectible Tournament...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Generate Test Tournament
              </>
            )}
          </Button>

          {lastTournament && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{lastTournament.poster_title}</CardTitle>
                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
                    {lastTournament.tournament_posters?.[0]?.rarity_level || 'Common'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {lastTournament.cover_art_url && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img 
                      src={lastTournament.cover_art_url} 
                      alt={lastTournament.poster_title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-black/50 text-white">
                        #{lastTournament.episode_number?.toString().padStart(3, '0')}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Game</p>
                    <p className="font-medium">{lastTournament.games?.display_name || 'Unknown Game'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Platform</p>
                    <p className="font-medium">{lastTournament.platform || 'PC'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Entry Fee</p>
                    <p className="font-medium">${lastTournament.entry_fee}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Prize Pool</p>
                    <p className="font-medium">${lastTournament.prize_pool}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Max Players</p>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lastTournament.max_participants}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tournament Type</p>
                    <p className="font-medium">{lastTournament.tournament_type || 'Single Elimination'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Collectible Series</p>
                  <p className="font-medium">{lastTournament.collectible_series}</p>
                </div>

                {lastTournament.tournament_posters?.[0] && (
                  <div className="text-xs text-muted-foreground">
                    Minted: {new Date(lastTournament.tournament_posters[0].mint_timestamp).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};