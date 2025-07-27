import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Gamepad2, RefreshCw } from "lucide-react";

interface Game {
  id: string;
  display_name: string;
  platform: string[];
}

interface GameAPIIntegration {
  id: string;
  game_id: string;
  platform: string;
  api_endpoint: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  stat_mappings: any;
  last_sync_at: string | null;
  games: {
    display_name: string;
  };
}

export function GameAPIIntegrations() {
  const [integrations, setIntegrations] = useState<GameAPIIntegration[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    game_id: '',
    platform: '',
    api_endpoint: '',
    rate_limit_per_minute: 60,
    stat_mappings: JSON.stringify({
      kills: "player_kills",
      deaths: "player_deaths",
      assists: "player_assists",
      damage_dealt: "damage_done",
      placement: "final_position"
    }, null, 2)
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [integrationsResult, gamesResult] = await Promise.all([
        supabase
          .from('game_api_integrations')
          .select(`
            *,
            games (display_name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('games')
          .select('id, display_name, platform')
          .eq('is_active', true)
      ]);

      if (integrationsResult.error) throw integrationsResult.error;
      if (gamesResult.error) throw gamesResult.error;

      setIntegrations(integrationsResult.data || []);
      setGames(gamesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load API integrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let statMappings;
      try {
        statMappings = JSON.parse(form.stat_mappings);
      } catch {
        throw new Error('Invalid JSON in stat mappings');
      }

      const { error } = await supabase
        .from('game_api_integrations')
        .insert({
          game_id: form.game_id,
          platform: form.platform,
          api_endpoint: form.api_endpoint.trim(),
          rate_limit_per_minute: form.rate_limit_per_minute,
          stat_mappings: statMappings,
          is_active: false // Start disabled for testing
        });

      if (error) throw error;

      toast({
        title: "Integration Added",
        description: "Game API integration has been created successfully"
      });

      setForm({
        game_id: '',
        platform: '',
        api_endpoint: '',
        rate_limit_per_minute: 60,
        stat_mappings: JSON.stringify({
          kills: "player_kills",
          deaths: "player_deaths",
          assists: "player_assists",
          damage_dealt: "damage_done",
          placement: "final_position"
        }, null, 2)
      });
      setShowAddForm(false);
      loadData();

    } catch (error: any) {
      console.error('Error creating integration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create integration",
        variant: "destructive"
      });
    }
  };

  const toggleIntegration = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('game_api_integrations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? "Integration Enabled" : "Integration Disabled",
        description: `API integration has been ${isActive ? 'enabled' : 'disabled'}`
      });

      loadData();
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration status",
        variant: "destructive"
      });
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'playstation': return 'bg-blue-500';
      case 'xbox': return 'bg-green-500';
      case 'steam': return 'bg-gray-600';
      case 'epic': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading API integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Game API Integrations</h2>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Add New API Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="game">Game</Label>
                  <Select value={form.game_id} onValueChange={(value) => setForm(prev => ({ ...prev, game_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map(game => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={form.platform} onValueChange={(value) => setForm(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="playstation">PlayStation</SelectItem>
                      <SelectItem value="xbox">Xbox Live</SelectItem>
                      <SelectItem value="steam">Steam</SelectItem>
                      <SelectItem value="epic">Epic Games</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={form.api_endpoint}
                  onChange={(e) => setForm(prev => ({ ...prev, api_endpoint: e.target.value }))}
                  placeholder="https://api.platform.com/v1/stats"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  min="1"
                  max="1000"
                  value={form.rate_limit_per_minute}
                  onChange={(e) => setForm(prev => ({ ...prev, rate_limit_per_minute: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="mappings">Stat Mappings (JSON)</Label>
                <Textarea
                  id="mappings"
                  value={form.stat_mappings}
                  onChange={(e) => setForm(prev => ({ ...prev, stat_mappings: e.target.value }))}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Integration</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  <div>
                    <CardTitle className="text-lg">{integration.games.display_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getPlatformColor(integration.platform)} text-white`}>
                        {integration.platform}
                      </Badge>
                      <Badge variant={integration.is_active ? "default" : "secondary"}>
                        {integration.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {integration.rate_limit_per_minute}/min
                  </div>
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Endpoint:</span> {integration.api_endpoint}
                </div>
                {integration.last_sync_at && (
                  <div className="text-sm text-muted-foreground">
                    Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Integrations</h3>
            <p className="text-muted-foreground mb-4">
              Add game API integrations to automatically verify match results
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}