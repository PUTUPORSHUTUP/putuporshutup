import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Camera, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Edit,
  Save,
  X,
  Loader2
} from "lucide-react";

interface UserProfile {
  id?: string;
  user_id?: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gamer_tag_psn: string | null;
  gamer_tag_xbox: string | null;
  gamer_tag_steam: string | null;
  wallet_balance: number;
  total_wins: number;
  total_losses: number;
  total_wagered: number;
}

export function ProfileDashboard() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
      setEditForm(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error saving profile",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const winRate = profile.total_wins + profile.total_losses > 0 
    ? (profile.total_wins / (profile.total_wins + profile.total_losses) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-gaming text-primary">
            PLAYER PROFILE
          </h1>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit className="w-4 h-4 mr-2" />
              EDIT PROFILE
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                SAVE
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                CANCEL
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                PROFILE INFO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-primary/50">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-xl">
                      {(profile.username || profile.display_name || user?.email || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 w-8 h-8"
                      variant="secondary"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>USERNAME</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter username"
                    />
                  ) : (
                    <p className="font-gaming">{profile.username || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>DISPLAY NAME</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.display_name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter display name"
                    />
                  ) : (
                    <p className="font-gaming">{profile.display_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <Label>EMAIL</Label>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaming Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>GAMING ACCOUNTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>PSN ID</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamer_tag_psn || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamer_tag_psn: e.target.value }))}
                    className="mt-1"
                    placeholder="Your PSN ID"
                  />
                ) : (
                  <p>{profile.gamer_tag_psn || "Not linked"}</p>
                )}
              </div>

              <div>
                <Label>XBOX GAMERTAG</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamer_tag_xbox || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamer_tag_xbox: e.target.value }))}
                    className="mt-1"
                    placeholder="Your Xbox Gamertag"
                  />
                ) : (
                  <p>{profile.gamer_tag_xbox || "Not linked"}</p>
                )}
              </div>

              <div>
                <Label>STEAM USERNAME</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamer_tag_steam || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamer_tag_steam: e.target.value }))}
                    className="mt-1"
                    placeholder="Your Steam Username"
                  />
                ) : (
                  <p>{profile.gamer_tag_steam || "Not linked"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                STATS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-gaming text-green-600">{profile.total_wins}</p>
                  <p className="text-sm text-muted-foreground">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-gaming text-red-600">{profile.total_losses}</p>
                  <p className="text-sm text-muted-foreground">Losses</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-gaming text-primary">{winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Wagered</span>
                  <span className="font-gaming">${profile.total_wagered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Wallet Balance</span>
                  <Badge variant="default">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${profile.wallet_balance.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              RECENT ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No recent activity. Start your first wager to see your activity here!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}