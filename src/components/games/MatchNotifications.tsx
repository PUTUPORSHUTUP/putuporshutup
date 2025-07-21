import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, X, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MatchNotification {
  id: string;
  notification_type: string;
  message: string;
  read: boolean;
  created_at: string;
  wager_id?: string;
  matched_user_id: string;
  profiles?: {
    display_name: string;
    username: string;
  };
}

interface MatchNotificationsProps {
  onNavigateToWager?: (wagerId: string) => void;
}

export const MatchNotifications = ({ onNavigateToWager }: MatchNotificationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel(`match-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New match notification:', payload);
            const newNotification = payload.new as MatchNotification;
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast for new match notifications
            if (newNotification.notification_type === 'match_found') {
              toast({
                title: "Match Found! 🎉",
                description: newNotification.message,
                action: newNotification.wager_id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToWager?.(newNotification.wager_id!)}
                  >
                    View Match
                  </Button>
                ) : undefined
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast, onNavigateToWager]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // First get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('match_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notificationsError) throw notificationsError;

      // Then get profile data for matched users
      if (notificationsData && notificationsData.length > 0) {
        const matchedUserIds = notificationsData.map(n => n.matched_user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username')
          .in('user_id', matchedUserIds);

        if (profilesError) throw profilesError;

        // Combine notifications with profile data
        const notificationsWithProfiles = notificationsData.map(notification => ({
          ...notification,
          profiles: profilesData?.find(profile => profile.user_id === notification.matched_user_id)
        }));

        setNotifications(notificationsWithProfiles);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load match notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('match_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('match_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      toast({
        title: "Notifications Updated",
        description: "All notifications marked as read"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_found':
        return <Check className="h-4 w-4 text-success" />;
      case 'match_expired':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'match_found':
        return <Badge variant="default" className="text-xs">Match Found</Badge>;
      case 'match_accepted':
        return <Badge variant="default" className="text-xs">Match Accepted</Badge>;
      case 'match_expired':
        return <Badge variant="secondary" className="text-xs">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Match Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No match notifications yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll see notifications here when matches are found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  notification.read 
                    ? 'bg-muted/30 border-border' 
                    : 'bg-card border-primary/20 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.notification_type)}
                      {getNotificationBadge(notification.notification_type)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.message}
                    </p>
                    
                    {notification.profiles && (
                      <p className="text-xs text-muted-foreground">
                        Matched with: {notification.profiles.display_name || notification.profiles.username}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notification.wager_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateToWager?.(notification.wager_id!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};