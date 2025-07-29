import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users, DollarSign, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const sundayShowdownImage = '/lovable-uploads/45d7073b-0f70-4555-95ab-c80162886810.png';

interface UpcomingTournament {
  id: string;
  title: string;
  description: string | null;
  entry_fee: number;
  max_participants: number;
  current_participants: number;
  prize_pool: number;
  platform: string;
  start_time: string | null;
  created_at: string;
  game: {
    id: string;
    display_name: string;
    name: string;
  };
}

interface UpcomingTournamentsProps {
  showAll?: boolean;
  maxItems?: number;
}

export const UpcomingTournaments = ({ showAll = false, maxItems = 3 }: UpcomingTournamentsProps) => {
  const [tournaments, setTournaments] = useState<UpcomingTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingTournaments();
  }, []);

  const loadUpcomingTournaments = async () => {
    try {
      // Get upcoming tournaments (open status and future start times)
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(*)
        `)
        .eq('status', 'open')
        .order('start_time', { ascending: true })
        .limit(showAll ? 100 : maxItems);

      if (error) {
        console.error('Error loading upcoming tournaments:', error);
        return;
      }

      // Add a featured tournament for Sunday Showdown
      const featuredTournament = {
        id: 'featured-sunday-showdown',
        title: 'Sunday Showdown Championship',
        description: 'Weekly championship tournament with special prizes and recognition',
        entry_fee: 25,
        max_participants: 32,
        current_participants: 8,
        prize_pool: 200,
        platform: 'Multi-Platform',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next Sunday
        created_at: new Date().toISOString(),
        game: {
          id: 'multi-game',
          display_name: 'Multi-Game Tournament',
          name: 'multi_game'
        }
      };

      const allTournaments = [featuredTournament, ...(data as UpcomingTournament[] || [])];
      setTournaments(allTournaments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(maxItems)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2">No Upcoming Tournaments</h3>
          <p className="text-muted-foreground">
            Check back soon for new tournament announcements!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament, index) => 
          index === 0 ? (
            // Featured Sunday Showdown Tournament - Clean poster only
            <div key={tournament.id} className="relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
              <img 
                src={sundayShowdownImage}
                alt="Sunday Showdown Championship"
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <Card 
              key={tournament.id} 
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {tournament.game.display_name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tournament.platform}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{tournament.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tournament Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-bold text-green-600">${tournament.entry_fee}</p>
                      <p className="text-xs text-muted-foreground">Entry Fee</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-bold text-yellow-600">${tournament.prize_pool}</p>
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold">
                        {tournament.current_participants}/{tournament.max_participants}
                      </p>
                      <p className="text-xs text-muted-foreground">Players</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-bold">Open</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                  </div>
                </div>

                {/* Start Time */}
                {tournament.start_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Starts: {new Date(tournament.start_time).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Description */}
                {tournament.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tournament.description}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <Link to="/tournaments">
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      View Tournament
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {!showAll && tournaments.length >= maxItems && (
        <div className="text-center">
          <Link to="/tournaments">
            <Button variant="outline" size="lg">
              View All Tournaments
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};