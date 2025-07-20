import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Camera, 
  Trophy, 
  DollarSign, 
  TrendingUp, 
  Edit,
  Save,
  X
} from "lucide-react";

interface UserProfile {
  username: string;
  email: string;
  gamerTagPSN: string;
  gamerTagXbox: string;
  gamerTagSteam: string;
  profilePic: string;
  walletBalance: number;
  totalWins: number;
  totalLosses: number;
  totalWagered: number;
}

export function ProfileDashboard() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    username: "ProGamer2024",
    email: "progamer@example.com",
    gamerTagPSN: "ProGamer_PSN",
    gamerTagXbox: "ProGamerXbox",
    gamerTagSteam: "ProGamerSteam",
    profilePic: "",
    walletBalance: 2500.00,
    totalWins: 47,
    totalLosses: 23,
    totalWagered: 15000.00
  });

  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
    // TODO: Save to Supabase
    console.log("Saving profile:", editForm);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const winRate = profile.totalWins + profile.totalLosses > 0 
    ? (profile.totalWins / (profile.totalWins + profile.totalLosses) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-gaming text-neon-orange">
            PLAYER PROFILE
          </h1>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-gradient-neon-blue hover:shadow-glow-blue"
            >
              <Edit className="w-4 h-4 mr-2" />
              EDIT PROFILE
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                className="bg-gradient-neon-green hover:shadow-glow-green"
              >
                <Save className="w-4 h-4 mr-2" />
                SAVE
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10"
              >
                <X className="w-4 h-4 mr-2" />
                CANCEL
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="bg-background-dark border-neon-blue/20">
            <CardHeader>
              <CardTitle className="text-neon-blue flex items-center gap-2">
                <User className="w-5 h-5" />
                PROFILE INFO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-neon-blue/50">
                    <AvatarImage src={profile.profilePic} />
                    <AvatarFallback className="bg-background-darker text-neon-blue text-xl">
                      {profile.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-blue/20 hover:bg-neon-blue/30"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground-light">USERNAME</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 bg-background-darker border-neon-blue/30"
                    />
                  ) : (
                    <p className="text-foreground font-gaming">{profile.username}</p>
                  )}
                </div>

                <div>
                  <Label className="text-foreground-light">EMAIL</Label>
                  <p className="text-foreground-muted">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaming Accounts */}
          <Card className="bg-background-dark border-neon-green/20">
            <CardHeader>
              <CardTitle className="text-neon-green">GAMING ACCOUNTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-foreground-light">PSN ID</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamerTagPSN}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamerTagPSN: e.target.value }))}
                    className="mt-1 bg-background-darker border-neon-green/30"
                    placeholder="Your PSN ID"
                  />
                ) : (
                  <p className="text-foreground">{profile.gamerTagPSN || "Not linked"}</p>
                )}
              </div>

              <div>
                <Label className="text-foreground-light">XBOX GAMERTAG</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamerTagXbox}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamerTagXbox: e.target.value }))}
                    className="mt-1 bg-background-darker border-neon-green/30"
                    placeholder="Your Xbox Gamertag"
                  />
                ) : (
                  <p className="text-foreground">{profile.gamerTagXbox || "Not linked"}</p>
                )}
              </div>

              <div>
                <Label className="text-foreground-light">STEAM USERNAME</Label>
                {isEditing ? (
                  <Input
                    value={editForm.gamerTagSteam}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gamerTagSteam: e.target.value }))}
                    className="mt-1 bg-background-darker border-neon-green/30"
                    placeholder="Your Steam Username"
                  />
                ) : (
                  <p className="text-foreground">{profile.gamerTagSteam || "Not linked"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-background-dark border-neon-orange/20">
            <CardHeader>
              <CardTitle className="text-neon-orange flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                STATS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-gaming text-neon-green">{profile.totalWins}</p>
                  <p className="text-sm text-foreground-light">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-gaming text-neon-orange">{profile.totalLosses}</p>
                  <p className="text-sm text-foreground-light">Losses</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-3xl font-gaming text-neon-blue">{winRate}%</p>
                <p className="text-sm text-foreground-light">Win Rate</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-light">Total Wagered</span>
                  <span className="text-neon-green font-gaming">${profile.totalWagered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground-light">Wallet Balance</span>
                  <Badge className="bg-gradient-neon-green text-background">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${profile.walletBalance.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-background-dark border-neon-pink/20">
          <CardHeader>
            <CardTitle className="text-neon-pink flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              RECENT ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-foreground-muted">
              No recent activity. Start your first wager to see your activity here!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}