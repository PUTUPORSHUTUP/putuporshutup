import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Trophy, Gamepad2, Users, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
  profile?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription for activities
    const activitiesChannel = supabase
      .channel('activities_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          const newActivity = payload.new as ActivityItem;
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep only 50 items
        }
      )
      .subscribe();

    // Set up subscription for new wagers
    const wagersChannel = supabase
      .channel('wagers_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wagers',
        },
        (payload) => {
          const newWager = payload.new as any;
          // Create synthetic activity for new wager
          const syntheticActivity: ActivityItem = {
            id: `wager_${newWager.id}`,
            user_id: newWager.creator_id,
            activity_type: 'wager_created',
            title: 'New Wager Created',
            description: `${newWager.title} - $${newWager.stake_amount}`,
            created_at: newWager.created_at,
            metadata: { wager_id: newWager.id, stake: newWager.stake_amount }
          };
          setActivities(prev => [syntheticActivity, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    // Set up subscription for tournaments
    const tournamentsChannel = supabase
      .channel('tournaments_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tournaments',
        },
        (payload) => {
          const newTournament = payload.new as any;
          const syntheticActivity: ActivityItem = {
            id: `tournament_${newTournament.id}`,
            user_id: newTournament.creator_id,
            activity_type: 'tournament_created',
            title: 'New Tournament',
            description: `${newTournament.title} - Entry: $${newTournament.entry_fee}`,
            created_at: newTournament.created_at,
            metadata: { tournament_id: newTournament.id, entry_fee: newTournament.entry_fee }
          };
          setActivities(prev => [syntheticActivity, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(wagersChannel);
      supabase.removeChannel(tournamentsChannel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'wager_created':
      case 'wager_joined':
        return <Gamepad2 className="h-4 w-4 text-blue-500" />;
      case 'tournament_created':
      case 'tournament_joined':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'match_won':
      case 'tournament_won':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'friend_added':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-primary" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'wager_created':
      case 'wager_joined':
        return 'bg-blue-100 text-blue-800';
      case 'tournament_created':
      case 'tournament_joined':
        return 'bg-yellow-100 text-yellow-800';
      case 'match_won':
      case 'tournament_won':
        return 'bg-green-100 text-green-800';
      case 'friend_added':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!user) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
        <CardDescription>
          See what's happening in the gaming community
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={activity.profile?.avatar_url} />
                      <AvatarFallback>
                        {activity.profile?.display_name?.[0] || 
                         activity.profile?.username?.[0] || 
                         'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getActivityIcon(activity.activity_type)}
                          <span className="font-medium text-sm">
                            {activity.profile?.display_name || 
                             activity.profile?.username || 
                             'Unknown User'}
                          </span>
                        </div>
                        <Badge 
                          className={`text-xs ${getActivityColor(activity.activity_type)}`}
                          variant="secondary"
                        >
                          {formatActivityType(activity.activity_type)}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                        {activity.metadata?.stake && (
                          <Badge variant="outline" className="text-xs">
                            ${activity.metadata.stake}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveActivityFeed;