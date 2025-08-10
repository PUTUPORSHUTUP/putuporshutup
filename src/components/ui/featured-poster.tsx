import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const sundayShowdownImage = '/lovable-uploads/26ea1408-24d7-4d09-ba97-0d7d6e2946fd.png';

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

  const onClick = () => {
    nav('/tournaments?id=featured-sunday-showdown');
  };

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300 hover:shadow-xl"
      aria-label="Sunday Showdown – Free-for-All, Winner-Takes-All, $5 Entry – PUOSU"
    >
      <img
        src={sundayShowdownImage}
        alt="Sunday Showdown – Free-for-All, Winner-Takes-All, $5 Entry – PUOSU"
        className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {/* Featured badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
          ⭐ Featured
        </div>
      </div>
      
      {/* Title and description overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-white">The Sunday Showdown</h3>
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded border border-white/30">
            Tournament
          </span>
        </div>
        
        <p className="text-sm text-white/90">
          7 PM • $5 Entry • $100 Prize • Call of Duty
        </p>
      </div>
    </button>
  );
};