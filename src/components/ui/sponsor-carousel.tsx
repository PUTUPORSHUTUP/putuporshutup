import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SponsorLogo {
  id: number;
  name: string;
  logo_url: string;
}

export function SponsorCarousel() {
  const [sponsors, setSponsors] = useState<SponsorLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const { data, error } = await supabase
          .from('sponsor_logos')
          .select('*')
          .eq('is_active', true)
          .order('id');

        if (error) {
          console.error('Error fetching sponsors:', error);
          return;
        }

        setSponsors(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center space-x-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-24 h-12 bg-muted animate-pulse rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {sponsors.map((sponsor) => (
            <CarouselItem key={sponsor.id} className="md:basis-1/3 lg:basis-1/5">
              <div className="p-4">
                <div className="flex items-center justify-center h-16 bg-background border rounded-lg hover:shadow-md transition-shadow">
                  <img
                    src={sponsor.logo_url}
                    alt={`${sponsor.name} logo`}
                    className="max-h-10 max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}