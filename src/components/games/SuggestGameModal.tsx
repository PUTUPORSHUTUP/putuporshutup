import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface SuggestGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_OPTIONS = ['PS5', 'Xbox', 'PC', 'Mobile', 'Nintendo Switch'];

export const SuggestGameModal = ({ open, onOpenChange }: SuggestGameModalProps) => {
  const [formData, setFormData] = useState({
    game_name: '',
    display_name: '',
    description: '',
    platforms: [] as string[],
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to suggest a game.",
        variant: "destructive",
      });
      return;
    }

    if (formData.platforms.length === 0) {
      toast({
        title: "Platforms Required",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('game_suggestions')
        .insert({
          user_id: user.id,
          game_name: formData.game_name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          description: formData.description,
          platform: formData.platforms,
          image_url: formData.image_url || null
        });

      if (error) throw error;

      toast({
        title: "Game Suggested!",
        description: "Your game suggestion has been submitted for review.",
      });

      setFormData({
        game_name: '',
        display_name: '',
        description: '',
        platforms: [],
        image_url: ''
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error suggesting game:', error);
      toast({
        title: "Error",
        description: "Failed to submit game suggestion.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest a Game</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="display_name">Game Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                display_name: e.target.value,
                game_name: e.target.value
              }))}
              placeholder="e.g., Call of Duty: Modern Warfare"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the game..."
              rows={3}
            />
          </div>

          <div>
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <Badge
                  key={platform}
                  variant={formData.platforms.includes(platform) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handlePlatformToggle(platform)}
                >
                  {platform}
                  {formData.platforms.includes(platform) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/game-image.jpg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Suggest Game"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};