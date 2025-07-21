import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Search, 
  Check, 
  X, 
  UserMinus,
  Crown,
  Star,
  Activity
} from 'lucide-react';

interface Friend {
  id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profiles: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_premium?: boolean;
    total_wins?: number;
    total_losses?: number;
  };
}

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  created_at: string;
  profiles: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export const SocialHub = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSocialData();
    }
  }, [user]);

  const loadSocialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadActivityFeed()
      ]);
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', user?.id)
      .eq('status', 'accepted');

    if (!error && friendships) {
      const friendIds = friendships.map(f => f.friend_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_premium, total_wins, total_losses')
        .in('user_id', friendIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setFriends(friendships.map(friendship => ({
        ...friendship,
        profiles: profileMap.get(friendship.friend_id) || {
          username: 'Unknown',
          display_name: 'Unknown User'
        }
      })) as Friend[]);
    }
  };

  const loadPendingRequests = async () => {
    const { data: requests, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user?.id)
      .eq('status', 'pending');

    if (!error && requests) {
      const userIds = requests.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_premium')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setPendingRequests(requests.map(request => ({
        ...request,
        profiles: profileMap.get(request.user_id) || {
          username: 'Unknown',
          display_name: 'Unknown User'
        }
      })) as Friend[]);
    }
  };

  const loadActivityFeed = async () => {
    // Get friends list first
    const { data: friendsList } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user?.id)
      .eq('status', 'accepted');

    const friendIds = friendsList?.map(f => f.friend_id) || [];
    friendIds.push(user?.id!); // Include own activities

    const { data: activityData, error } = await supabase
      .from('activities')
      .select('*')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && activityData) {
      const userIds = activityData.map(a => a.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setActivities(activityData.map(activity => ({
        ...activity,
        profiles: profileMap.get(activity.user_id) || {
          username: 'Unknown',
          display_name: 'Unknown User'
        }
      })) as Activity[]);
    }
  };

  const searchPlayers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_premium, total_wins, total_losses')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (!error && data) {
        // Check which users are already friends
        const { data: existingFriends } = await supabase
          .from('friendships')
          .select('friend_id, status')
          .eq('user_id', user?.id)
          .in('friend_id', data.map(p => p.user_id));

        const friendsMap = new Map(existingFriends?.map(f => [f.friend_id, f.status]) || []);

        setSearchResults(data.map(profile => ({
          ...profile,
          friendship_status: friendsMap.get(profile.user_id) || null
        })));
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully!",
      });

      // Update search results
      setSearchResults(results => 
        results.map(r => 
          r.user_id === friendId 
            ? { ...r, friendship_status: 'pending' }
            : r
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
      });

      loadSocialData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Request Rejected",
        description: "Friend request has been rejected.",
      });

      loadSocialData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request.",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Removed",
        description: "Friend has been removed from your friends list.",
      });

      loadSocialData();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend.",
        variant: "destructive",
      });
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'wager_win':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'tournament_win':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'friend_added':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading social features...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            SOCIAL HUB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friends">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search">
                Find Players
              </TabsTrigger>
              <TabsTrigger value="activity">
                Activity Feed
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="friends">
                <div className="space-y-3">
                  {friends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No friends yet</p>
                      <p className="text-sm">Use the search tab to find players to connect with!</p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friend.profiles.avatar_url} />
                            <AvatarFallback>
                              {(friend.profiles.display_name || friend.profiles.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {friend.profiles.display_name || friend.profiles.username}
                              </p>
                              {friend.profiles.is_premium && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {friend.profiles.total_wins || 0}W - {friend.profiles.total_losses || 0}L
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeFriend(friend.id)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requests">
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.profiles.avatar_url} />
                            <AvatarFallback>
                              {(request.profiles.display_name || request.profiles.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {request.profiles.display_name || request.profiles.username}
                              </p>
                              {request.profiles.is_premium && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Wants to be friends
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => acceptFriendRequest(request.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="search">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by username or display name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPlayers()}
                    />
                    <Button onClick={searchPlayers} disabled={searching}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {searchResults.map((player) => (
                      <div
                        key={player.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={player.avatar_url} />
                            <AvatarFallback>
                              {(player.display_name || player.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {player.display_name || player.username}
                              </p>
                              {player.is_premium && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {player.total_wins || 0}W - {player.total_losses || 0}L
                            </p>
                          </div>
                        </div>
                        <div>
                          {player.friendship_status === 'accepted' ? (
                            <Badge variant="default">Friends</Badge>
                          ) : player.friendship_status === 'pending' ? (
                            <Badge variant="secondary">Pending</Badge>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => sendFriendRequest(player.user_id)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Friend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity from you and your friends will appear here</p>
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="mt-1">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={activity.profiles.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {(activity.profiles.display_name || activity.profiles.username || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium text-sm">
                              {activity.profiles.display_name || activity.profiles.username}
                            </p>
                          </div>
                          <p className="text-sm">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};