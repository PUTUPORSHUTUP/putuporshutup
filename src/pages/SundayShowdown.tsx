import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function SundayShowdown() {
  const { user } = useAuth();
  const [gamertag, setGamertag] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const TOURNAMENT_ID = "sunday-showdown-aug3";

  // Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(19, 0, 0); // 7 PM EST
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("⏰ Tournament is live!");
        clearInterval(interval);
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for duplicate entry
  useEffect(() => {
    if (user) {
      supabase
        .from("tournament_entries")
        .select("*")
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data?.length && data.length > 0) setAlreadyJoined(true);
        });
    }
  }, [user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamertag || !user) return;

    if (alreadyJoined) {
      setStatusMsg("⚠️ You've already joined this tournament.");
      return;
    }

    const { error } = await supabase.from("tournament_entries").insert([
      {
        user_id: user.id,
        tournament_id: TOURNAMENT_ID,
        email: user.email || "",
        gamertag,
      },
    ]);

    if (error) {
      setStatusMsg("❌ Error joining. Try again.");
      return;
    }

    setAlreadyJoined(true);
    setStatusMsg("✅ Successfully joined!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-xl mx-auto p-6 bg-card border-primary shadow-2xl rounded-2xl">
          <CardContent className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary mb-2">
                🔥 Sunday Showdown - COD 6
              </h1>
              <p className="text-sm text-muted-foreground">Multiplayer Free-for-All</p>
              <p className="text-sm text-muted-foreground">🕖 Sunday @ 7 PM EST</p>
              <p className="text-sm text-green-500">Entry: $5 | 5–10 Players</p>
              <p className="text-sm text-yellow-500 mb-4">Sponsored by PUOSU</p>
              <p className="text-yellow-500 font-bold mb-6">🕒 Starts in: {timeLeft}</p>
            </div>

            {!user ? (
              <p className="text-center text-destructive">
                ⚠️ You must be logged in to join this tournament.
              </p>
            ) : alreadyJoined ? (
              <p className="text-center text-green-500 font-semibold">
                ✅ You're already registered!
              </p>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  placeholder="Enter your gamertag"
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  required
                  className="bg-input text-foreground border-border"
                />
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white" type="submit">
                  Confirm & Join
                </Button>
              </form>
            )}

            {statusMsg && (
              <p className="text-center text-sm text-yellow-500">{statusMsg}</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Tournament ID: {TOURNAMENT_ID}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}