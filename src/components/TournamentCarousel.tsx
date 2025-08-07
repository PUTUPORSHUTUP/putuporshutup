import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

interface TournamentPoster {
  id: string;
  title: string;
  image_url: string;
  description: string | null;
  featured: boolean;
  is_active: boolean;
  is_archived: boolean;
  event_type: string | null;
  display_order: number | null;
}

export default function TournamentCarousel() {
  const [posters, setPosters] = useState<TournamentPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      const { data, error } = await supabase
        .from('posters')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosters(data || []);
    } catch (error) {
      console.error('Error fetching posters:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament posters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePosterClick = (poster: TournamentPoster) => {
    // For now, just navigate to tournaments page or specific event
    if (poster.event_type === 'sunday_showdown') {
      window.open('/sunday-showdown', '_blank');
    } else {
      window.open('/tournaments', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4 w-48"></div>
          <div className="flex space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (posters.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Featured Tournaments
        </h2>
        <div className="text-sm text-muted-foreground">
          {posters.length} tournament{posters.length !== 1 ? 's' : ''} available
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {posters.map((poster) => (
            <CarouselItem key={poster.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="relative group cursor-pointer" onClick={() => handlePosterClick(poster)}>
                    {poster.image_url ? (
                      <img
                        src={poster.image_url}
                        alt={poster.title || 'Tournament poster'}
                        className="w-full h-64 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🏆</div>
                          <div className="text-muted-foreground">Tournament</div>
                        </div>
                      </div>
                    )}
                    
                    {poster.featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">
                        Featured
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Tournament
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate">
                      {poster.title}
                    </h3>
                    {poster.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {poster.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}