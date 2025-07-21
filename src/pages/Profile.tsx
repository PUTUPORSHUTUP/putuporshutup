import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentComponent } from '@/components/profile/PaymentComponent';
import { PremiumSubscription } from '@/components/profile/PremiumSubscription';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Loader2, Camera, Trophy, TrendingUp, DollarSign, GamepadIcon, Save, Crown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  gamer_tag_xbox: string;
  gamer_tag_psn: string;
  gamer_tag_steam: string;
  wallet_balance: number;
  total_wins: number;
  total_losses: number;
  total_wagered: number;
  is_premium: boolean;
  premium_expires_at: string;
}

interface WagerHistory {
  id: string;
  title: string;
  stake_amount: number;
  status: string;
  winner_id: string;
  created_at: string;
  game: {
    display_name: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wagerHistory, setWagerHistory] = useState<WagerHistory[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadWagerHistory();
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    setLoadingSubscription(true);
    try {
      const { data } = await supabase.functions.invoke('check-premium-subscription');
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleSubscriptionUpdate = () => {
    loadProfile();
    checkSubscriptionStatus();
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWagerHistory = async () => {
    try {
      // Get wagers where user was creator or participant
      const { data: createdWagers } = await supabase
        .from('wagers')
        .select(`
          id, title, stake_amount, status, winner_id, created_at,
          game:games(display_name)
        `)
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: participatedWagers } = await supabase
        .from('wager_participants')
        .select(`
          wager:wagers(
            id, title, stake_amount, status, winner_id, created_at,
            game:games(display_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false })
        .limit(10);

      const allWagers = [
        ...(createdWagers || []),
        ...(participatedWagers?.map(p => p.wager).filter(Boolean) || [])
      ];

      // Remove duplicates and sort by date
      const uniqueWagers = allWagers.filter((wager, index, arr) => 
        arr.findIndex(w => w.id === wager.id) === index
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setWagerHistory(uniqueWagers as WagerHistory[]);
    } catch (error) {
      console.error('Error loading wager history:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      
      toast({
        title: "Avatar Updated!",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          gamer_tag_xbox: profile.gamer_tag_xbox,
          gamer_tag_psn: profile.gamer_tag_psn,
          gamer_tag_steam: profile.gamer_tag_steam,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Saved!",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || !profile) return;

    setDeleting(true);
    try {
      // Delete the profile (this will cascade and delete related data due to foreign keys)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Deleted",
        description: "Your profile has been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const getWinRate = () => {
    if (!profile || (profile.total_wins + profile.total_losses) === 0) return 0;
    return Math.round((profile.total_wins / (profile.total_wins + profile.total_losses)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">Unable to load your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile.display_name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                {uploading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
            
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{profile.display_name || profile.username}</h1>
                {profile.is_premium && (
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    <Badge className="bg-yellow-600 text-white text-xs">PREMIUM</Badge>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">{profile.bio || 'No bio yet'}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{profile.total_wins}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{profile.total_losses}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{getWinRate()}%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">${profile.wallet_balance}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Balance</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="edit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Edit Profile Tab */}
        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GamepadIcon className="w-5 h-5" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name || ''}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gamer Tags</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="xbox">Xbox Gamertag</Label>
                    <Input
                      id="xbox"
                      value={profile.gamer_tag_xbox || ''}
                      onChange={(e) => setProfile({ ...profile, gamer_tag_xbox: e.target.value })}
                      placeholder="Xbox gamertag"
                    />
                  </div>
                  <div>
                    <Label htmlFor="psn">PlayStation Network</Label>
                    <Input
                      id="psn"
                      value={profile.gamer_tag_psn || ''}
                      onChange={(e) => setProfile({ ...profile, gamer_tag_psn: e.target.value })}
                      placeholder="PSN ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="steam">Steam ID</Label>
                    <Input
                      id="steam"
                      value={profile.gamer_tag_steam || ''}
                      onChange={(e) => setProfile({ ...profile, gamer_tag_steam: e.target.value })}
                      placeholder="Steam ID"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1 sm:flex-none">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1 sm:flex-none">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Profile Permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your profile, 
                        including all your wager history, stats, and account data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteProfile} 
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Forever'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Premium Membership Tab */}
        <TabsContent value="premium" className="space-y-6">
          <PremiumSubscription 
            onSubscriptionUpdate={handleSubscriptionUpdate}
            currentSubscription={subscription}
          />
        </TabsContent>

        {/* Wallet Management Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <PaymentComponent 
            balance={profile.wallet_balance} 
            onBalanceUpdate={loadProfile}
            isPremiumUser={profile.is_premium}
          />
        </TabsContent>

        {/* Stats Dashboard Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Wagered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">${profile.total_wagered}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{getWinRate()}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold">{profile.total_wins + profile.total_losses}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold">${profile.wallet_balance}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gamer Tags Display */}
          <Card>
            <CardHeader>
              <CardTitle>Gaming Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.gamer_tag_xbox && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      XB
                    </div>
                    <div>
                      <div className="font-medium">Xbox</div>
                      <div className="text-sm text-muted-foreground">{profile.gamer_tag_xbox}</div>
                    </div>
                  </div>
                )}
                {profile.gamer_tag_psn && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      PS
                    </div>
                    <div>
                      <div className="font-medium">PlayStation</div>
                      <div className="text-sm text-muted-foreground">{profile.gamer_tag_psn}</div>
                    </div>
                  </div>
                )}
                {profile.gamer_tag_steam && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-white text-xs font-bold">
                      ST
                    </div>
                    <div>
                      <div className="font-medium">Steam</div>
                      <div className="text-sm text-muted-foreground">{profile.gamer_tag_steam}</div>
                    </div>
                  </div>
                )}
              </div>
              {!profile.gamer_tag_xbox && !profile.gamer_tag_psn && !profile.gamer_tag_steam && (
                <p className="text-muted-foreground text-center py-4">
                  No gamer tags set up yet. Add them in the Edit Profile tab!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Match History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {wagerHistory.length > 0 ? (
                <div className="space-y-3">
                  {wagerHistory.map((wager) => (
                    <div key={wager.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{wager.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {wager.game.display_name} • ${wager.stake_amount} stake
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            wager.status === 'completed' && wager.winner_id === user?.id ? 'default' :
                            wager.status === 'completed' ? 'destructive' :
                            wager.status === 'in_progress' ? 'secondary' : 'outline'
                          }
                        >
                          {wager.status === 'completed' && wager.winner_id === user?.id ? 'Won' :
                           wager.status === 'completed' ? 'Lost' :
                           wager.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(wager.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No match history yet. Join some wagers to see your history here!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;