import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart, Trophy, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SponsorPerformanceData {
  tournament_name: string;
  tier: string;
  logo_impressions: number;
  clicks_to_site: number;
  report_link: string;
}

export default function SponsorDashboard() {
  const [sponsors, setSponsors] = useState<SponsorPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSponsorData() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("sponsor_performance")
          .select("*");

        if (error) {
          console.error("Error fetching sponsor data:", error);
          toast({
            title: "Error",
            description: "Failed to load sponsor performance data",
            variant: "destructive",
          });
          return;
        }

        setSponsors(data || []);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error", 
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSponsorData();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sponsor Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            {sponsors.length} active sponsorships
          </div>
        </div>

        {sponsors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sponsorships Found</h3>
              <p className="text-muted-foreground text-center">
                No sponsor performance data is available at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sponsors.map((sponsor, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold">{sponsor.tournament_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Sponsorship Tier: <span className="font-medium">{sponsor.tier}</span>
                        </p>
                      </div>
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          <span className="font-medium">{sponsor.logo_impressions.toLocaleString()}</span> Logo Impressions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          <span className="font-medium">{sponsor.clicks_to_site.toLocaleString()}</span> Site Clicks
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-fit" asChild>
                      <a 
                        href={sponsor.report_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Full Report
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}