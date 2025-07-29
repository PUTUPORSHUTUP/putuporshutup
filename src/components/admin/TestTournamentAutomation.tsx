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
      console.log('🎮 Starting automation test...');
      
      // First, ensure we have tournament templates for automation to work
      const { data: templates, error: templatesError } = await supabase
        .from('tournament_templates')
        .select('*')
        .eq('is_active', true);

      console.log('📋 Found templates:', templates, templatesError);

      if (!templates?.length) {
        console.log('🔧 No templates found, creating test template...');
        
        // Get a game to use for the template
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .limit(1);

        console.log('🎮 Found games:', games, gamesError);

        if (games?.length) {
          const { data: newTemplate, error: templateError } = await supabase
            .from('tournament_templates')
            .insert({
              template_name: 'Test Championship Template',
              schedule_cron: '0 */2 * * *', // Every 2 hours
              game_id: games[0].id,
              max_participants: 8,
              entry_fee: 25,
              collectible_series: 'Elite Gaming Championship',
              poster_title_template: '{series} #{episode}: {variation}',
              title_variations: ['Elite Showdown', 'Pro Championship', 'Masters Cup'],
              cover_art_url: '/placeholder-tournament.jpg',
              is_active: true
            })
            .select()
            .single();

          console.log('✨ Created template:', newTemplate, templateError);
        }
      }

      // Check automation config
      const { data: automationConfig, error: configError } = await supabase
        .from('automation_config')
        .select('*')
        .eq('automation_type', 'tournament_scheduler');

      console.log('⚙️ Automation config:', automationConfig, configError);

      if (!automationConfig?.length) {
        console.log('🔧 Creating automation config...');
        await supabase
          .from('automation_config')
          .insert({
            automation_type: 'tournament_scheduler',
            is_enabled: true,
            run_frequency_minutes: 60,
            config_data: { max_tournaments_per_run: 1 },
            next_run_at: new Date().toISOString()
          });
      }

      // Call the automation orchestrator to create a test tournament
      console.log('🤖 Calling automation orchestrator...');
      const { data: automationResult, error: automationError } = await supabase.functions.invoke('automation-orchestrator', {
        body: { test: true }
      });

      console.log('🔄 Automation response:', automationResult, automationError);

      if (automationError) {
        throw new Error(`Automation error: ${automationError.message}`);
      }

      // Wait a moment for the tournament to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch the latest tournament to show the result - use maybeSingle to avoid 406 error
      console.log('📋 Fetching latest tournament...');
      const { data: latestTournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select(`
          *,
          games(name, display_name),
          tournament_posters(*)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('🏆 Latest tournament:', latestTournament, tournamentError);

      if (tournamentError) {
        throw new Error(`Tournament fetch error: ${tournamentError.message}`);
      }

      if (latestTournament) {
        setLastTournament(latestTournament);
        toast({
          title: "🎉 Collectible Tournament Created!",
          description: `Generated: ${latestTournament.poster_title || latestTournament.title}`,
          duration: 5000,
        });
      } else {
        // If no tournament was created, let's create one manually for testing
        console.log('🔧 No tournament found, creating manual test tournament...');
        
        const { data: testGame } = await supabase
          .from('games')
          .select('*')
          .limit(1)
          .single();

        if (testGame) {
          const { data: manualTournament, error: manualError } = await supabase
            .from('tournaments')
            .insert({
              title: 'Test Elite Championship #001: Pro Showdown',
              game_id: testGame.id,
              max_participants: 8,
              entry_fee: 25,
              prize_pool: 180, // 8 * 25 * 0.9
              status: 'open',
              tournament_type: 'single_elimination',
              start_time: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
              cover_art_url: '/placeholder-tournament.jpg',
              poster_title: 'Elite Gaming Championship #001: Pro Showdown',
              collectible_series: 'Elite Gaming Championship',
              season_number: 1,
              episode_number: 1,
              platform: 'PC',
              creator_id: '00000000-0000-0000-0000-000000000000' // System-created tournament
            })
            .select(`
              *,
              games(name, display_name)
            `)
            .single();

          if (manualError) {
            throw new Error(`Manual tournament creation error: ${manualError.message}`);
          }

          // Create poster entry
          await supabase
            .from('tournament_posters')
            .insert({
              tournament_id: manualTournament.id,
              poster_title: 'Elite Gaming Championship #001: Pro Showdown',
              cover_art_url: '/placeholder-tournament.jpg',
              series_name: 'Elite Gaming Championship',
              season_number: 1,
              episode_number: 1,
              rarity_level: 'legendary'
            });

          // Fetch the complete tournament with poster data
          const { data: completeTournament } = await supabase
            .from('tournaments')
            .select(`
              *,
              games(name, display_name),
              tournament_posters(*)
            `)
            .eq('id', manualTournament.id)
            .single();

          setLastTournament(completeTournament);
          
          toast({
            title: "🎉 Test Tournament Created!",
            description: `Manual test: ${completeTournament.poster_title}`,
            duration: 5000,
          });
        }
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