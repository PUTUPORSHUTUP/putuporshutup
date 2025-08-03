import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Posters will be fetched from database

const getWeekNumber = (date: Date) => {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
};

export default function SundayShowdown() {
  const { user } = useAuth();
  const [poster, setPoster] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [map, setMap] = useState("Random Map will be revealed at 6:45 PM EST");
  const [recaps, setRecaps] = useState<any[]>([]);
  const [gamertag, setGamertag] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const TOURNAMENT_ID = "sunday-showdown-aug3";

  useEffect(() => {
    // Fetch posters from database and rotate them
    const fetchPosters = async () => {
      const { data } = await supabase
        .from("posters")
        .select("image_url")
        .eq("event_type", "sunday_showdown")
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("display_order");
      
      if (data && data.length > 0) {
        const weekIndex = getWeekNumber(new Date()) % data.length;
        setPoster(data[weekIndex].image_url);
      } else {
        // Fallback to uploaded poster
        setPoster("/lovable-uploads/4e3b5b2c-0ba4-4d1b-988c-245b68239da1.png");
      }
    };
    
    fetchPosters();

    // Fetch registered players
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("tournament_entries")
        .select("gamertag")
        .eq("tournament_id", TOURNAMENT_ID);
      
      if (data) {
        setPlayers(data);
      }
    };
    fetchPlayers();

    // Countdown Timer
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

      // Optional: Random map assignment before match
      if (now.getHours() === 18 && now.getMinutes() >= 45) {
        const maps = ["Nuketown", "Shipment", "Shoot House", "Rust"];
        const randomMap = maps[Math.floor(Math.random() * maps.length)];
        setMap(randomMap);
      }

      // Auto-hide after event (after 9 PM EST)
      if (now.getHours() >= 21) {
        setIsVisible(false);
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
    
    // Refresh players list
    const { data } = await supabase
      .from("tournament_entries")
      .select("gamertag")
      .eq("tournament_id", TOURNAMENT_ID);
    
    if (data) {
      setPlayers(data);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto bg-card border-primary shadow-2xl rounded-2xl">
          <CardContent className="space-y-6 p-6">
            <img src={poster} alt="Sunday Showdown Poster" className="w-full rounded-xl mb-4" />

            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Sunday Showdown - COD 6</h2>
              <p className="text-sm text-muted-foreground">🕖 Starts at 7PM EST</p>
              <p className="text-sm text-green-500 mb-2">Entry: $5 | Max: 16 Players</p>
              <p className="text-sm text-yellow-500 mb-4">📍 Map: {map}</p>
              <p className="text-yellow-500 font-bold mb-6">🕒 Starts in: {timeLeft}</p>
            </div>

            <div>
              <h3 className="text-md font-bold text-foreground mb-2">✅ Registered Players:</h3>
              <ul className="text-sm text-muted-foreground mb-4 max-h-32 overflow-y-auto">
                {players.length > 0 ? (
                  players.map((player, index) => (
                    <li key={index}>🎮 {player.gamertag}</li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No players registered yet.</li>
                )}
              </ul>
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
                  Join Tournament
                </Button>
              </form>
            )}

            {statusMsg && (
              <p className="text-center text-sm text-yellow-500">{statusMsg}</p>
            )}

            {/* Recap & Rating Section */}
            <div className="border-t border-border pt-4">
              <h3 className="text-md font-bold text-foreground mb-2">📸 Match Recaps:</h3>
              {recaps.length > 0 ? (
                recaps.map((recap) => (
                  <div key={recap.id} className="bg-secondary rounded-lg p-3 mb-2">
                    <p className="text-sm text-foreground">{recap.gamertag} - {recap.placement} - {recap.kills} Kills</p>
                    <img src={recap.screenshot_url} alt="Proof" className="w-full mt-2 rounded" />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No recaps submitted yet.</p>
              )}

              <h3 className="text-md font-bold text-foreground mt-6 mb-2">⭐ Rate This Tournament:</h3>
              <Input type="range" min="1" max="5" step="1" className="w-full" />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tournament ID: {TOURNAMENT_ID}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}