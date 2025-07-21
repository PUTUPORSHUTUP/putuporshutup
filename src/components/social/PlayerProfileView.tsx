import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Star, 
  MessageCircle, 
  Crown,
  Trophy,
  Target,
  Calendar,
  Send,
  UserPlus,
  UserCheck
} from 'lucide-react';

interface PlayerProfile {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_premium?: boolean;
  total_wins: number;
  total_losses: number;
  total_wagered: number;
  wallet_balance: number;
  created_at: string;
}

interface PlayerReview {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface PlayerProfileViewProps {
  playerId: string;
  onClose: () => void;
}

export const PlayerProfileView = ({ playerId, onClose }: PlayerProfileViewProps) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [reviews, setReviews] = useState<PlayerReview[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    setLoading(true);
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', playerId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('player_reviews')
        .select('*')
        .eq('reviewed_id', playerId);

      if (!reviewsError && reviewsData) {
        const reviewerIds = reviewsData.map(r => r.reviewer_id);
        
        const { data: reviewerProfiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', reviewerIds);

        const profileMap = new Map(reviewerProfiles?.map(p => [p.user_id, p]) || []);

        setReviews(reviewsData.map(review => ({
          ...review,
          reviewer: profileMap.get(review.reviewer_id) || {
            username: 'Unknown',
            display_name: 'Unknown User'
          }
        })));
      }

      // Check friendship status
      if (user?.id !== playerId) {
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('status')
          .eq('user_id', user?.id)
          .eq('friend_id', playerId)
          .single();

        setFriendshipStatus(friendshipData?.status || null);
      }
    } catch (error) {
      console.error('Error loading player data:', error);
      toast({
        title: "Error",
        description: "Failed to load player profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user?.id,
          friend_id: playerId,
          status: 'pending'
        });

      if (error) throw error;

      setFriendshipStatus('pending');
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: playerId,
          content: message.trim()
        });

      if (error) throw error;

      setMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      toast({
        title: "Review Required",
        description: "Please add a comment to your review.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('player_reviews')
        .insert({
          reviewer_id: user?.id,
          reviewed_id: playerId,
          rating: newReview.rating,
          comment: newReview.comment.trim()
        });

      if (error) throw error;

      setNewReview({ rating: 5, comment: '' });
      loadPlayerData();
      toast({
        title: "Review Submitted",
        description: "Your review has been added!",
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading player profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Player not found</div>
        </CardContent>
      </Card>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const winRate = profile.total_wins + profile.total_losses > 0 
    ? (profile.total_wins / (profile.total_wins + profile.total_losses)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_premium && <Crown className="w-6 h-6 text-yellow-500" />}
              </div>
              
              {profile.username && profile.display_name && (
                <p className="text-muted-foreground mb-2">@{profile.username}</p>
              )}
              
              {profile.bio && (
                <p className="text-sm mb-4">{profile.bio}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-bold">{profile.total_wins}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-lg font-bold">{averageRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{new Date(profile.created_at).getFullYear()}</p>
                  <p className="text-xs text-muted-foreground">Joined</p>
                </div>
              </div>

              {user?.id !== playerId && (
                <div className="flex gap-3">
                  {friendshipStatus === 'accepted' ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Friends
                    </Badge>
                  ) : friendshipStatus === 'pending' ? (
                    <Badge variant="secondary">Request Pending</Badge>
                  ) : (
                    <Button size="sm" onClick={sendFriendRequest}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                  
                  <div className="flex gap-2 flex-1">
                    <Input
                      placeholder="Send a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={sendMessage} disabled={!message.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Player Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.id !== playerId && (
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-3">Leave a Review</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer ${
                        star <= newReview.rating 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    />
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience playing with this player..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                />
                <Button size="sm" onClick={submitReview}>
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={review.reviewer.avatar_url} />
                      <AvatarFallback>
                        {(review.reviewer.display_name || review.reviewer.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {review.reviewer.display_name || review.reviewer.username}
                        </p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating 
                                  ? 'text-yellow-500 fill-yellow-500' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm mb-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};