import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface FeaturedPoster {
  id: string;
  title: string;
  description: string;
  image_url: string;
  event_type: string;
}

export const FeaturedPoster = () => {
  const [featuredPoster, setFeaturedPoster] = useState<FeaturedPoster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPoster();
  }, []);

  const fetchFeaturedPoster = async () => {
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('id, title, description, image_url, event_type')
        .eq('featured', true)
        .eq('is_active', true)
        .eq('is_archived', false)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching featured poster:', error);
        return;
      }

      setFeaturedPoster(data);
    } catch (error) {
      console.error('Error fetching featured poster:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-muted rounded-xl h-64 w-full max-w-md mx-auto"></div>
      </div>
    );
  }

  if (!featuredPoster) {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={featuredPoster.image_url}
            alt={featuredPoster.title}
            className="w-full h-64 object-cover rounded-t-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-primary/90 text-primary-foreground flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-orbitron font-bold text-lg">{featuredPoster.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {featuredPoster.event_type}
            </Badge>
          </div>
          
          {featuredPoster.description && (
            <p className="text-sm text-muted-foreground font-orbitron">
              {featuredPoster.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};