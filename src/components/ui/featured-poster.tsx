import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type PosterRow = {
  id: string;
  title: string | null;
  image_url: string;
  description: string | null;
  event_type: string | null;
  featured: boolean;
};

// Simple fallback for featured poster navigation
function getFeaturedPosterLink(): string {
  return "/tournaments"; // Default fallback to tournaments page
}

export const FeaturedPoster = () => {
  const nav = useNavigate();
  const [poster, setPoster] = useState<PosterRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("posters")
        .select("id,title,image_url,description,event_type,featured")
        .eq("featured", true)
        .eq("is_active", true)
        .eq("is_archived", false)
        .limit(1)
        .maybeSingle();

      if (mounted) {
        if (error) console.error("Load featured poster failed:", error);
        setPoster(data || null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onClick = () => {
    if (!poster) return;
    const url = getFeaturedPosterLink();
    nav(url);
  };

  if (loading) {
    return (
      <div className="w-full aspect-[16/9] animate-pulse rounded-2xl bg-muted" />
    );
  }

  if (!poster) return null;

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:shadow-xl"
      aria-label={poster.title || "Featured tournament"}
    >
      <img
        src={poster.image_url}
        alt={poster.title || "Featured tournament poster"}
        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder.svg';
        }}
      />
      {/* Featured badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
          ⭐ Featured
        </div>
      </div>
      
      {/* Title and description overlay */}
      {(poster.title || poster.description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          {poster.title && (
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-white">{poster.title}</h3>
              {poster.event_type && (
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded border border-white/30">
                  {poster.event_type}
                </span>
              )}
            </div>
          )}
          
          {poster.description && (
            <p className="text-sm text-white/90">
              {poster.description}
            </p>
          )}
        </div>
      )}
    </button>
  );
};