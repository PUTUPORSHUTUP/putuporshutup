import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Gamepad2 } from "lucide-react";

const Index = () => {
  const [matchCountdown, setMatchCountdown] = useState({ minutes: 3, seconds: 12 });
  const [selectedMode, setSelectedMode] = useState("all");
  const [recentMatches, setRecentMatches] = useState([
    { id: 1, winner: "PlayerPro", loser: "GamerX", game: "Call of Duty 6", winnings: "$25", time: "2 min ago" },
    { id: 2, winner: "ApexLegend", loser: "Noob123", game: "Apex Legends", winnings: "$15", time: "5 min ago" },
    { id: 3, winner: "NBA_King", loser: "Baller2K", game: "NBA 2K25", winnings: "$35", time: "8 min ago" },
    { id: 4, winner: "MaddenGod", loser: "RookiePlayer", game: "Madden", winnings: "$20", time: "12 min ago" },
    { id: 5, winner: "FortniteAce", loser: "BuildMaster", game: "Fortnite", winnings: "$18", time: "15 min ago" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMatchCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 3, seconds: 12 }; // Reset countdown
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredMatches = selectedMode === "all" 
    ? recentMatches 
    : recentMatches.filter(match => 
        match.game.toLowerCase().includes(selectedMode.toLowerCase().replace(" ", ""))
      );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="w-full text-center py-8 px-4 bg-gradient-to-r from-black to-muted text-white">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">No excuses. Just winners.</h1>
        <p className="text-lg md:text-xl text-muted-foreground">Automated console matches. Earn cash. Dominate 24/7.</p>
      </section>

      {/* Live Match Preview */}
      <section className="bg-muted py-6 px-4">
        <div className="max-w-3xl mx-auto text-center text-foreground">
          <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Next Match: <span className="text-primary">Call of Duty 6 – Kill Race</span>
          </h2>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-2">
            <Clock className="w-4 h-4" />
            Starts in: <span className="font-mono text-primary">{formatTime(matchCountdown.minutes, matchCountdown.seconds)}</span>
          </p>
          <div className="mt-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl">
              Join Match Queue
            </Button>
          </div>
        </div>
      </section>

      {/* Match Mode Filter */}
      <section className="bg-background py-4 px-4 border-b border-border">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label htmlFor="mode-filter" className="font-medium text-foreground">
            Filter by Game Mode:
          </label>
          <Select value={selectedMode} onValueChange={setSelectedMode}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="killrace">Kill Race</SelectItem>
              <SelectItem value="apex">Apex Legends</SelectItem>
              <SelectItem value="nba">NBA 2K25</SelectItem>
              <SelectItem value="madden">Madden</SelectItem>
              <SelectItem value="fortnite">Fortnite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Match Results Feed */}
      <section className="bg-muted/50 py-6 px-4 text-foreground">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🔥 Recent Match Results
          </h3>
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{match.winner}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-muted-foreground">{match.loser}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{match.game}</span>
                      <span className="text-primary font-semibold">{match.winnings}</span>
                      <span className="text-muted-foreground">{match.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredMatches.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No matches found for selected filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* Mini Leaderboard */}
      <section className="bg-muted py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏆 Top Players
          </h3>
          <ol className="space-y-2 text-sm">
            <li className="flex justify-between items-center p-2 bg-card rounded border-border border">
              <span>1. BigJudah007</span>
              <span className="text-primary font-semibold">57 Wins</span>
            </li>
            <li className="flex justify-between items-center p-2 bg-card rounded border-border border">
              <span>2. SharpAim95</span>
              <span className="text-primary font-semibold">44 Wins</span>
            </li>
            <li className="flex justify-between items-center p-2 bg-card rounded border-border border">
              <span>3. iSnipe4Cash</span>
              <span className="text-primary font-semibold">38 Wins</span>
            </li>
          </ol>
          <div className="mt-4">
            <a href="/leaderboards" className="text-primary hover:underline text-sm">
              View Full Leaderboard →
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background py-6 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            💡 How It Works
          </h3>
          <ol className="space-y-2 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Link your gamertag</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Fund your wallet ($5+)</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Auto-join the next match</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Win and get paid instantly</span>
            </li>
          </ol>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="bg-muted py-6 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h4 className="text-md font-semibold mb-4 flex items-center justify-center gap-2">
            📲 Scan to Play
          </h4>
          <div className="inline-block p-4 bg-card rounded-lg border border-border">
            <div className="w-24 h-24 bg-muted-foreground/10 rounded flex items-center justify-center mx-auto mb-2">
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>
            <p className="text-xs text-muted-foreground">putuporshutup.online</p>
          </div>
        </div>
      </section>

      {/* Additional Stats Section */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-6">Platform Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">247</div>
                <div className="text-sm text-muted-foreground">Matches Today</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">$12,580</div>
                <div className="text-sm text-muted-foreground">Total Winnings</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">1,432</div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-4 px-4 text-center border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground text-xs">
            © 2025 Put Up or Shut Up™ – All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;