import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, User, Play, Zap } from "lucide-react";

export default function IndexPage() {
  const { user, profile } = useAuth();
  const [systemStatus, setSystemStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const balance = profile?.wallet_balance || 0;
  const isSetup = profile?.xbox_gamertag && balance >= 5;

  useEffect(() => {
    const checkSystem = async () => {
      const { error } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
      setSystemStatus(!error);
      setLoading(false);
    };
    checkSystem();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* System Status */}
      <div className="w-full bg-primary/5 border-b px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${systemStatus ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-muted-foreground">
            {systemStatus ? "System Online • 24/7 Automation Active" : "System Offline"}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">PUOSU Gaming</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automated 24/7 gaming platform with instant payouts and seamless wallet management
          </p>
          
          {!user ? (
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth">Join Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Badge variant={isSetup ? "default" : "secondary"} className="text-sm px-3 py-1">
                {isSetup ? "✅ Ready to Play" : "⚠️ Setup Required"}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Actions */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Wallet</CardTitle>
                </div>
                <CardDescription>Manage funds & withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
                  <Button asChild className="w-full">
                    <Link to="/wallet">
                      <Wallet className="w-4 h-4 mr-2" />
                      Manage Wallet
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Profile</CardTitle>
                </div>
                <CardDescription>Setup gamertag & preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {profile?.xbox_gamertag ? `GT: ${profile.xbox_gamertag}` : "No gamertag linked"}
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Live Matches</CardTitle>
                </div>
                <CardDescription>24/7 automated gaming</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {isSetup ? "Ready to join matches" : "Complete setup first"}
                  </div>
                  <Button 
                    disabled={!isSetup} 
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isSetup ? "Join Match" : "Setup Required"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">24/7 Automation</h3>
            <p className="text-sm text-muted-foreground">
              Continuous match rotation with instant results
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Instant Payouts</h3>
            <p className="text-sm text-muted-foreground">
              Automatic wallet credits and fast withdrawals
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Simple Setup</h3>
            <p className="text-sm text-muted-foreground">
              Link gamertag, add funds, and start playing
            </p>
          </div>
        </div>

        {profile?.is_admin && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-medium">Admin Access</span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}