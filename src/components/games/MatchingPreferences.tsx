import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Target, Clock, DollarSign, Gamepad2, Monitor } from 'lucide-react';

interface MatchingPreferencesProps {
  onPreferencesUpdate?: () => void;
}

interface Game {
  id: string;
  display_name: string;
  name: string;
  platform: string[];
}

interface MatchPreferences {
  min_stake: number;
  max_stake: number;
  preferred_games: string[];
  preferred_platforms: string[];
  auto_match_enabled: boolean;
  max_queue_time_minutes: number;
}

const AVAILABLE_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

export const MatchingPreferences = ({ onPreferencesUpdate }: MatchingPreferencesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [preferences, setPreferences] = useState<MatchPreferences>({
    min_stake: 10,
    max_stake: 100,
    preferred_games: [],
    preferred_platforms: [],
    auto_match_enabled: false,
    max_queue_time_minutes: 30
  });

  useEffect(() => {
    loadGames();
    loadPreferences();
  }, [user]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive"
      });
    }
  };

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('match_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          min_stake: Number(data.min_stake),
          max_stake: Number(data.max_stake),
          preferred_games: data.preferred_games || [],
          preferred_platforms: data.preferred_platforms || [],
          auto_match_enabled: data.auto_match_enabled,
          max_queue_time_minutes: data.max_queue_time_minutes
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load matching preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('match_preferences')
        .upsert({
          user_id: user.id,
          min_stake: preferences.min_stake,
          max_stake: preferences.max_stake,
          preferred_games: preferences.preferred_games,
          preferred_platforms: preferences.preferred_platforms,
          auto_match_enabled: preferences.auto_match_enabled,
          max_queue_time_minutes: preferences.max_queue_time_minutes,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your matching preferences have been updated successfully."
      });

      onPreferencesUpdate?.();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStakeRangeChange = (values: number[]) => {
    setPreferences(prev => ({
      ...prev,
      min_stake: values[0],
      max_stake: values[1]
    }));
  };

  const handleGameToggle = (gameId: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferred_games: checked 
        ? [...prev.preferred_games, gameId]
        : prev.preferred_games.filter(id => id !== gameId)
    }));
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferred_platforms: checked 
        ? [...prev.preferred_platforms, platform]
        : prev.preferred_platforms.filter(p => p !== platform)
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Automatic Matching Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-match toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Enable Auto-Matching</Label>
            <p className="text-sm text-muted-foreground">
              Automatically find opponents when you join the matching queue
            </p>
          </div>
          <Switch
            checked={preferences.auto_match_enabled}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, auto_match_enabled: checked }))
            }
          />
        </div>

        {preferences.auto_match_enabled && (
          <>
            {/* Stake Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="h-4 w-4" />
                Stake Range: ${preferences.min_stake} - ${preferences.max_stake}
              </Label>
              <Slider
                value={[preferences.min_stake, preferences.max_stake]}
                onValueChange={handleStakeRangeChange}
                min={1}
                max={1000}
                step={1}
                className="w-full"
              />
              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-stake">Minimum</Label>
                  <Input
                    id="min-stake"
                    type="number"
                    value={preferences.min_stake}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      min_stake: Math.max(1, Number(e.target.value)) 
                    }))}
                    min={1}
                    max={preferences.max_stake}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-stake">Maximum</Label>
                  <Input
                    id="max-stake"
                    type="number"
                    value={preferences.max_stake}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      max_stake: Math.max(preferences.min_stake, Number(e.target.value)) 
                    }))}
                    min={preferences.min_stake}
                    max={1000}
                  />
                </div>
              </div>
            </div>

            {/* Preferred Games */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Gamepad2 className="h-4 w-4" />
                Preferred Games
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {games.map((game) => (
                  <div key={game.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`game-${game.id}`}
                      checked={preferences.preferred_games.includes(game.id)}
                      onCheckedChange={(checked) => 
                        handleGameToggle(game.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`game-${game.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {game.display_name}
                    </Label>
                  </div>
                ))}
              </div>
              {preferences.preferred_games.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.preferred_games.map((gameId) => {
                    const game = games.find(g => g.id === gameId);
                    return game ? (
                      <Badge key={gameId} variant="secondary" className="text-xs">
                        {game.display_name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Preferred Platforms */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Monitor className="h-4 w-4" />
                Preferred Platforms
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PLATFORMS.map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={preferences.preferred_platforms.includes(platform)}
                      onCheckedChange={(checked) => 
                        handlePlatformToggle(platform, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`platform-${platform}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
              {preferences.preferred_platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.preferred_platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Queue Time Limit */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Clock className="h-4 w-4" />
                Maximum Queue Time: {preferences.max_queue_time_minutes} minutes
              </Label>
              <Select
                value={preferences.max_queue_time_minutes.toString()}
                onValueChange={(value) => 
                  setPreferences(prev => ({ 
                    ...prev, 
                    max_queue_time_minutes: Number(value) 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How long to stay in the matching queue before automatically removing you
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button 
          onClick={savePreferences} 
          disabled={saving} 
          className="w-full"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};