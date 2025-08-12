import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DemoJoinButton from '@/components/DemoJoinButton';

type DemoMatch = {
  id: string;
  game: string;
  mode: string;
  platform: string;
  starts_at: string;
  ends_at: string | null;
  state: "active" | "closed" | "canceled";
};

export default function QueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<DemoMatch | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("demo_matches")
        .select("*")
        .eq("state", "active")
        .gte("starts_at", new Date(Date.now() - 30*60*1000).toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error) setMatch(data as DemoMatch | null);

      if (data && user) {
        const { data: p } = await supabase
          .from("demo_participants")
          .select("id")
          .eq("match_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (p) setAlreadyIn(true);
      }
    };
    load();
  }, [user]);

  const handleJoin = async () => {
    if (!user) {
      navigate("/auth?next=/queue");
      return;
    }
    if (!match) return;
    setJoinBusy(true);
    try {
      const { error } = await supabase.from("demo_participants").insert({
        match_id: match.id,
        user_id: user.id,
      });
      if (error && !error.message.includes("duplicate key")) throw error;
      setJoined(true);
      setAlreadyIn(true);
    } catch (e) {
      alert("Could not join. Please try again.");
    } finally {
      setJoinBusy(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">🎮 Free Match Queue</CardTitle>
          <p className="text-muted-foreground">
            Join our free "Multiplayer" demo matches running on Xbox Series X. No wallet needed.
          </p>
          <div className="mt-4">
            <DemoJoinButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!match && (
            <div className="bg-muted rounded p-4">
              <p>No active free match right now. New ones start automatically every 30 minutes.</p>
            </div>
          )}

          {match && (
            <div className="bg-card rounded p-4 border space-y-3">
              <div className="text-lg font-semibold">
                {match.game} — {match.mode} • {match.platform}
              </div>
              <div className="text-sm text-muted-foreground">
                Starts: {new Date(match.starts_at).toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                {alreadyIn ? (
                  <Button variant="outline" disabled>
                    ✅ You're in!
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoin}
                    disabled={joinBusy}
                  >
                    {joinBusy ? "Joining…" : "Join Match"}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                >
                  Back Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}