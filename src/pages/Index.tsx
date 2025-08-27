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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-900">
      {/* Tournament Engine Status Banner */}
      <div className="w-full bg-sky-400 rounded-full mx-4 mt-4 px-6 py-3 max-w-2xl">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-900">
          <Zap className="w-4 h-4 text-red-500 animate-pulse" />
          TOURNAMENT ENGINE LIVE - New matches every 20 minutes
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8">
        {/* Hero Title */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black tracking-tight text-emerald-400">
            ENDLESS
          </h1>
          <h2 className="text-6xl md:text-7xl font-black tracking-tight text-emerald-400">
            TOURNAMENTS
          </h2>
          
          <p className="text-2xl text-amber-300 font-semibold max-w-2xl mx-auto">
            No Subscriptions. No Waiting.<br />
            Just Skill + Cash.
          </p>
          
          <p className="text-lg text-amber-200 max-w-3xl mx-auto leading-relaxed">
            Join automated tournaments every 20 minutes. Entry fees only. 
            Winners get paid instantly. The platform that runs itself.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!user ? (
            <>
              <Button 
                asChild 
                size="lg" 
                className="w-full max-w-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-lg py-6 rounded-full"
              >
                <Link to="/auth">
                  <Play className="w-5 h-5 mr-2" />
                  JOIN NEXT TOURNAMENT
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full max-w-md border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 font-bold text-lg py-6 rounded-full"
                asChild
              >
                <Link to="/how-it-works">
                  <Zap className="w-5 h-5 mr-2" />
                  HOW IT WORKS
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-6">
                <Badge variant={isSetup ? "default" : "secondary"} className="text-lg px-4 py-2 bg-emerald-500 text-slate-900">
                  {isSetup ? "✅ Ready to Compete" : "⚠️ Setup Required"}
                </Badge>
              </div>
              
              <Button 
                disabled={!isSetup}
                size="lg" 
                className="w-full max-w-md bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-lg py-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 mr-2" />
                {isSetup ? "JOIN NEXT TOURNAMENT" : "COMPLETE SETUP FIRST"}
              </Button>
              
              {/* Quick Stats for logged in users */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-emerald-400 text-2xl font-bold">${balance.toFixed(2)}</div>
                  <div className="text-amber-200 text-sm">Balance</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-emerald-400 text-2xl font-bold">
                    {profile?.xbox_gamertag ? "✓" : "×"}
                  </div>
                  <div className="text-amber-200 text-sm">Gamertag</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Access for Authenticated Users */}
        {user && (
          <div className="flex gap-4 justify-center pt-8">
            <Button asChild variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900">
              <Link to="/wallet">
                <Wallet className="w-4 h-4 mr-2" />
                Wallet
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900">
              <Link to="/profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        )}

        {profile?.is_admin && (
          <Card className="border-amber-400 bg-amber-400/10 max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-medium">Admin Access</span>
                <Button asChild variant="outline" size="sm" className="border-amber-400 text-amber-400">
                  <Link to="/admin">Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}