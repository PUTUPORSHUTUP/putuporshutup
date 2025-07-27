import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Gamepad2, 
  Plus, 
  Edit3, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Game {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  platform: string[];
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const GameManagement = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGame, setNewGame] = useState({
    name: '',
    display_name: '',
    description: '',
    platform: [] as string[],
    image_url: ''
  });

  const { toast } = useToast();

  const platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
      toast({
        title: "Error",
        description: "Failed to load games.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGameStatus = async (gameId: string, isActive: boolean) => {
    setSaving(gameId);
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: isActive })
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(games.map(game => 
        game.id === gameId ? { ...game, is_active: isActive } : game
      ));

      toast({
        title: "Game Updated",
        description: `Game ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Error",
        description: "Failed to update game status.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handlePlatformToggle = (platform: string, gameData: any, setGameData: any) => {
    const currentPlatforms = gameData.platform;
    const updatedPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter((p: string) => p !== platform)
      : [...currentPlatforms, platform];
    
    setGameData({ ...gameData, platform: updatedPlatforms });
  };

  const addGame = async () => {
    if (!newGame.name || !newGame.display_name) {
      toast({
        title: "Validation Error",
        description: "Name and display name are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving('new');
    try {
      const gameSlug = newGame.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { error } = await supabase
        .from('games')
        .insert({
          name: gameSlug,
          display_name: newGame.display_name,
          description: newGame.description || null,
          platform: newGame.platform,
          image_url: newGame.image_url || null,
          is_active: true
        });

      if (error) throw error;

      await loadGames();
      setIsAddDialogOpen(false);
      setNewGame({
        name: '',
        display_name: '',
        description: '',
        platform: [],
        image_url: ''
      });

      toast({
        title: "Game Added",
        description: "New game added successfully.",
      });
    } catch (error) {
      console.error('Error adding game:', error);
      toast({
        title: "Error",
        description: "Failed to add game.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateGame = async () => {
    if (!editingGame) return;

    setSaving(editingGame.id);
    try {
      const { error } = await supabase
        .from('games')
        .update({
          display_name: editingGame.display_name,
          description: editingGame.description,
          platform: editingGame.platform,
          image_url: editingGame.image_url
        })
        .eq('id', editingGame.id);

      if (error) throw error;

      await loadGames();
      setEditingGame(null);

      toast({
        title: "Game Updated",
        description: "Game updated successfully.",
      });
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Error",
        description: "Failed to update game.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            Game Management
          </h2>
          <p className="text-muted-foreground">Activate, deactivate, and manage games on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadGames} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Game
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Game</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={newGame.display_name}
                    onChange={(e) => setNewGame({ ...newGame, display_name: e.target.value })}
                    placeholder="Call of Duty: Modern Warfare"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Slug (auto-generated)</Label>
                  <Input
                    id="name"
                    value={newGame.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGame.description}
                    onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                    placeholder="Game description..."
                  />
                </div>
                <div>
                  <Label>Platforms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant={newGame.platform.includes(platform) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handlePlatformToggle(platform, newGame, setNewGame)}
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={newGame.image_url}
                    onChange={(e) => setNewGame({ ...newGame, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={addGame} 
                    disabled={saving === 'new'}
                    className="flex-1"
                  >
                    {saving === 'new' ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Add Game
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {games.map((game) => (
          <Card key={game.id} className={`${game.is_active ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
            <CardContent className="p-4">
              {editingGame?.id === game.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_display_name">Display Name</Label>
                      <Input
                        id="edit_display_name"
                        value={editingGame.display_name}
                        onChange={(e) => setEditingGame({ ...editingGame, display_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch
                          checked={editingGame.is_active}
                          onCheckedChange={(checked) => setEditingGame({ ...editingGame, is_active: checked })}
                        />
                        <span className="text-sm">
                          {editingGame.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit_description">Description</Label>
                    <Textarea
                      id="edit_description"
                      value={editingGame.description || ''}
                      onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {platforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant={editingGame.platform.includes(platform) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handlePlatformToggle(platform, editingGame, setEditingGame)}
                        >
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit_image_url">Image URL</Label>
                    <Input
                      id="edit_image_url"
                      value={editingGame.image_url || ''}
                      onChange={(e) => setEditingGame({ ...editingGame, image_url: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={updateGame} 
                      disabled={saving === game.id}
                      size="sm"
                    >
                      {saving === game.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingGame(null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {game.image_url ? (
                        <img 
                          src={game.image_url} 
                          alt={game.display_name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Gamepad2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{game.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{game.description}</p>
                      <div className="flex gap-1 mt-1">
                        {game.platform.map((platform) => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {game.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-red-600" />
                      )}
                      <Switch
                        checked={game.is_active}
                        onCheckedChange={(checked) => toggleGameStatus(game.id, checked)}
                        disabled={saving === game.id}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGame(game)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};