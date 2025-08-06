import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  const handlePosterClick = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-muted rounded-xl h-96 w-full max-w-4xl mx-auto"></div>
      </div>
    );
  }

  if (!featuredPoster) {
    return null;
  }

  return (
    <Card 
      className="w-full max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={handlePosterClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={featuredPoster.image_url}
            alt={featuredPoster.title}
            className="w-full h-auto object-contain rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-4 right-4">
            <Badge variant="default" className="bg-orange-500 text-white border-0 flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </Badge>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 rounded-b-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-orbitron font-bold text-xl text-white">{featuredPoster.title}</h3>
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {featuredPoster.event_type}
              </Badge>
            </div>
            
            {featuredPoster.description && (
              <p className="text-sm text-white/90 font-orbitron">
                {featuredPoster.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};