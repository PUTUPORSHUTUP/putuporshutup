import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Clock, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Square
} from 'lucide-react';

interface LiveEvent {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  entry_fee: number;
  prize_pool: number;
  current_participants: number;
  max_participants: number;
  start_time: string;
  registration_closes_at?: string;
  game_name?: string;
  game_mode?: string;
  created_at: string;
}

interface EventStats {
  totalEvents: number;
  totalPlayers: number;
  totalPrizePool: number;
}

export function LiveEventsMonitor() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [stats, setStats] = useState<EventStats>({ totalEvents: 0, totalPlayers: 0, totalPrizePool: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadEvents = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setRefreshing(true);
    
    try {
      const { data: tournamentsData, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          title,
          status,
          entry_fee,
          prize_pool,
          current_participants,
          max_participants,
          start_time,
          registration_closes_at,
          created_at,
          game:games(name)
        `)
        .in('status', ['open', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedEvents: LiveEvent[] = (tournamentsData || []).map(tournament => ({
        id: tournament.id,
        title: tournament.title,
        status: tournament.status as LiveEvent['status'],
        entry_fee: tournament.entry_fee || 0,
        prize_pool: tournament.prize_pool || 0,
        current_participants: tournament.current_participants || 0,
        max_participants: tournament.max_participants || 0,
        start_time: tournament.start_time,
        registration_closes_at: tournament.registration_closes_at,
        game_name: tournament.game?.name || 'Unknown Game',
        game_mode: 'Winner Takes All', // Default for now
        created_at: tournament.created_at
      }));

      setEvents(formattedEvents);

      // Calculate stats
      const activeEvents = formattedEvents.filter(e => e.status !== 'cancelled');
      const totalStats = activeEvents.reduce((acc, event) => ({
        totalEvents: acc.totalEvents + 1,
        totalPlayers: acc.totalPlayers + event.current_participants,
        totalPrizePool: acc.totalPrizePool + event.prize_pool
      }), { totalEvents: 0, totalPlayers: 0, totalPrizePool: 0 });

      setStats(totalStats);

    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadEvents(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: LiveEvent['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-500">🟢 Registration Open</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-yellow-500">🟡 In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-red-500">🔴 Finished</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">❌ Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTimeRemaining = (startTime: string, status: LiveEvent['status']) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    
    if (status === 'completed') return 'Event finished';
    if (status === 'in_progress') return 'Event in progress';
    if (diffMs < 0) return 'Starting soon...';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `Starts in ${diffHours}h ${diffMinutes}m`;
    }
    return `Starts in ${diffMinutes}m`;
  };

  const handleForceRefund = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event cancelled and refunds initiated",
      });
      
      loadEvents(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel event",
        variant: "destructive",
      });
    }
  };

  const handleForcePayout = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event marked as completed and payouts initiated",
      });
      
      loadEvents(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to force payout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Live Events Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading events...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Live Events Monitor
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time status for all active & upcoming events • Auto-refresh every 30 seconds
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadEvents(false)}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
            <p className="text-muted-foreground">
              All events have been completed or there are no upcoming events.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Event Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold line-clamp-1">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Game:</strong> {event.game_name}</p>
                      <p><strong>Mode:</strong> {event.game_mode}</p>
                      <p><strong>Created:</strong> {new Date(event.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Entry:</strong> ${event.entry_fee}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Prize Pool:</strong> ${event.prize_pool}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        <strong>Players:</strong> {event.current_participants}/{event.max_participants}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {getTimeRemaining(event.start_time, event.status)}
                      </span>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {event.status !== 'completed' && (
                      <>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleForceRefund(event.id)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Force Refund
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleForcePayout(event.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Force Payout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Play className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.totalEvents}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Events Running</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.totalPlayers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Players Across All Events</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">${stats.totalPrizePool}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Prize Pool in Play</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}