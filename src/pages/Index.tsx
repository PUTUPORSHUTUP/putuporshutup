import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Gamepad2, QrCode } from "lucide-react";

const Index = () => {
  const [matchCountdown, setMatchCountdown] = useState({ minutes: 3, seconds: 12 });
  const [selectedMode, setSelectedMode] = useState("all");
  const [recentMatches, setRecentMatches] = useState([
    { id: 1, player: "SharpAim95", amount: 5, game: "Apex Team Deathmatch", result: "won" },
    { id: 2, player: "BigJudah007", amount: 8, game: "2K25 Street Match", result: "won" },
    { id: 3, player: "ClutchSniper88", amount: 12, game: "COD6 Blitz", result: "won" },
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

  const joinMatch = () => {
    const isVerified = localStorage.getItem('is_verified_gamertag') === 'true';
    const walletBalance = parseFloat(localStorage.getItem('wallet_balance') || '0');

    if (!isVerified || walletBalance < 5) {
      alert('❌ You must verify your gamertag and have at least $5 in your wallet to join a match.');
      return;
    }

    // ✅ Redirect to queue or trigger Supabase logic
    window.location.href = '/queue';
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Banner */}
      <section className="w-full text-center py-8 px-4 bg-gradient-to-r from-black to-gray-900 text-white">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">No excuses. Just winners.</h1>
        <p className="text-lg md:text-xl text-gray-300">Join automated matches every 30 minutes. No subscriptions. No waiting. Just skill + cash.</p>
      </section>

      {/* Live Match Preview */}
      <section className="bg-zinc-950 py-6 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-xl font-semibold">
            🎮 Next Match: <span className="text-green-400">Call of Duty – Team Deathmatch</span>
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            ⏰ Starts in: <span className="font-mono text-green-400">00:30:00</span>
          </p>
          <div className="text-center mt-4">
            <button 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md"
              onClick={joinMatch}
            >
              Join Match Queue
            </button>
          </div>
        </div>
      </section>

      {/* Match Mode Filter Dropdown */}
      <section className="bg-black py-4 px-4 text-white">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="mode-filter" className="mb-2 sm:mb-0 font-medium">Filter by Game Mode:</label>
          <Select value={selectedMode} onValueChange={setSelectedMode}>
            <SelectTrigger className="bg-zinc-900 text-white border-zinc-700 w-full sm:w-[200px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 text-white border-zinc-700">
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="tdm">Team Deathmatch</SelectItem>
              <SelectItem value="apex">Apex Legends</SelectItem>
              <SelectItem value="nba">NBA 2K25</SelectItem>
              <SelectItem value="madden">Madden</SelectItem>
              <SelectItem value="fortnite">Fortnite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Match Results Feed */}
      <section className="bg-zinc-900 py-6 px-4 text-white">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">🔥 Recent Match Results</h3>
          <ul className="space-y-2 text-sm">
            {filteredMatches.map((match, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>
                  {match.result === 'won' ? '🎯' : '💀'} {match.player} {match.result === 'won' ? 'won' : 'lost'} ${match.amount} in {match.game}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mini Leaderboard */}
      <section className="bg-zinc-950 py-6 px-4 text-white">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">🏆 Top Players</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>BigJudah007 – 57 Wins</li>
            <li>SharpAim95 – 44 Wins</li>
            <li>iSnipe4Cash – 38 Wins</li>
          </ol>
          <div className="mt-2">
            <a href="/leaderboards" className="text-blue-400 hover:underline text-sm">View Full Leaderboard →</a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-black py-6 px-4 text-white">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">💡 How It Works</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Link your gamertag</li>
            <li>Fund your wallet ($5+)</li>
            <li>Auto-join the next match</li>
            <li>Win and get paid instantly</li>
          </ol>
        </div>
      </section>

      {/* QR Code Block */}
      <section className="bg-black py-6 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h4 className="text-md font-semibold mb-3">📲 Scan to Join PUOSU</h4>
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?data=https://putuporshutup.online&size=200x200&margin=10" 
            alt="QR Code to PUOSU"
            className="mx-auto w-48 h-48 border-4 border-white rounded shadow-md"
          />
          <p className="text-xs text-gray-400 mt-3">Visit: <br /> https://putuporshutup.online</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-4 px-4 text-center text-gray-500 text-xs">
        © 2025 Put Up or Shut Up™ – All Rights Reserved
      </footer>
    </div>
  );
};

export default Index;