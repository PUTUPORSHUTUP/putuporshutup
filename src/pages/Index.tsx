import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Gamepad2, QrCode } from "lucide-react";
import { FeaturedPoster } from "@/components/ui/featured-poster";
import TournamentCarousel from "@/components/TournamentCarousel";
import MidweekMayhemCarousel from "@/components/MidweekMayhemCarousel";
import FreeDemoCountdown from "@/components/FreeDemoCountdown";
import SmartBanner from "@/components/SmartBanner";
import { supabase } from "@/integrations/supabase/client";

type BannerType = {
  type: 'none' | 'verify' | 'funds' | 'auth';
  msg?: string;
};

const Index = () => {
  const navigate = useNavigate();
  const [matchCountdown, setMatchCountdown] = useState({ minutes: 3, seconds: 12 });
  const [selectedMode, setSelectedMode] = useState("all");
  const [recentMatches, setRecentMatches] = useState([
    { id: 1, player: "SharpAim95", amount: 5, game: "Apex Team Deathmatch", result: "won" },
    { id: 2, player: "BigJudah007", amount: 8, game: "2K25 Street Match", result: "won" },
    { id: 3, player: "ClutchSniper88", amount: 12, game: "COD6 Blitz", result: "won" },
  ]);

  // TEMP: Hide Filter Active Matches
  const SHOW_MATCH_FILTERS = false;

  // Banner state for join validation
  const [joinBanner, setJoinBanner] = useState<BannerType>({ type: 'none' });

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

  const joinMatch = async () => {
    try {
      // Clear any existing banner
      setJoinBanner({ type: 'none' });
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setJoinBanner({ type: 'auth', msg: 'Please sign in to join matches.' });
        return;
      }

      // Check gamertag verification and wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('xbox_gamertag, xbox_linked_at, wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setJoinBanner({ type: 'auth', msg: 'Profile not found. Please sign in again.' });
        return;
      }

      // Check if Xbox gamertag is verified (has xbox_gamertag and xbox_linked_at)
      if (!profile.xbox_gamertag || !profile.xbox_linked_at) {
        setJoinBanner({ 
          type: 'verify', 
          msg: 'Verify your Xbox gamertag to join matches.' 
        });
        return;
      }

      // Check wallet balance
      const balance = Number(profile.wallet_balance || 0);
      if (balance < 5) {
        setJoinBanner({ 
          type: 'funds', 
          msg: `You need at least $5 in your wallet to join. Current balance: $${balance.toFixed(2)}` 
        });
        return;
      }

      // All checks passed - proceed to queue
      navigate('/queue');
    } catch (error) {
      console.error('Join match error:', error);
      setJoinBanner({ 
        type: 'auth', 
        msg: 'Something went wrong. Please try again.' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Smart Banner */}
      <SmartBanner />

      {/* Enhanced Mobile-Optimized Hero Section */}
      <section className="w-full bg-black text-white py-8 px-4 md:px-10 rounded-lg shadow-lg">
        {/* Promo Poster */}
        <div className="mb-6">
          <img 
            src="/lovable-uploads/13412423-6f9e-439b-bdfe-130d9db066d8.png"
            alt="Play to Win – PUOSU" 
            className="w-full max-w-full h-auto rounded-xl shadow-md object-cover"
          />
        </div>

        {/* Headline */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-center text-orange-500 mb-2">
          No Luck. No Excuses. Just Winners.
        </h1>
        <p className="text-center text-sm text-gray-300 mb-6">
          Compete in real skill-based matches. Win real cash. Join your first $5 game right now — or start your 7-day VIP trial for exclusive perks.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-bold w-full sm:w-auto text-center transition-colors"
            onClick={joinMatch}
          >
            ✅ Join Match Queue
          </button>
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg text-sm font-bold w-full sm:w-auto text-center transition-colors"
            onClick={() => navigate('/start-trial')}
          >
            🎟️ Start Free VIP Trial
          </button>
        </div>

        {/* Join Validation Banner */}
        {joinBanner.type !== 'none' && (
          <div className="mt-4 rounded-xl p-4 bg-yellow-900/30 border border-yellow-600 max-w-md mx-auto">
            <p className="text-yellow-100 mb-3 text-sm">{joinBanner.msg}</p>
            <div className="flex gap-2 justify-center">
              {joinBanner.type === 'verify' && (
                <button 
                  onClick={() => navigate('/profile')} 
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  Verify Gamertag
                </button>
              )}
              {joinBanner.type === 'funds' && (
                <button 
                  onClick={() => navigate('/wallet')} 
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                >
                  Add Funds
                </button>
              )}
              {joinBanner.type === 'auth' && (
                <button 
                  onClick={() => navigate('/auth')} 
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
                >
                  Sign In
                </button>
              )}
              <button 
                onClick={() => setJoinBanner({ type: 'none' })} 
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Featured Poster Section */}
      <section className="py-6 px-4">
        <FeaturedPoster />
      </section>

      {/* Sunday Showdown Tournament Carousel */}
      <section className="py-6 px-4">
        <TournamentCarousel />
      </section>

      {/* Midweek Mayhem Tournament Carousel */}
      <section className="py-6 px-4">
        <MidweekMayhemCarousel />
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
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors"
              onClick={joinMatch}
            >
              Join Match Queue
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Game & Mode Filter Section - TEMPORARILY HIDDEN */}
      {SHOW_MATCH_FILTERS && (
        <section className="bg-black text-white px-4 py-8 rounded-xl shadow-lg max-w-4xl mx-auto my-6">
          <div className="max-w-2xl mx-auto">
            {/* Section Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-orange-500 text-center mb-1">Filter Active Matches</h2>
            <p className="text-center text-xs sm:text-sm text-gray-400 mb-6">
              Quickly narrow down live matches by game or match type.
            </p>

            {/* Filter Dropdowns */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {/* Filter by Game */}
              <div>
                <label className="text-white text-xs sm:text-sm font-semibold mb-2 block">🎮 Filter by Game:</label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger className="w-full bg-black border border-gray-700 rounded-lg text-white py-2 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="cod">Call of Duty 6</SelectItem>
                    <SelectItem value="apex">Apex Legends</SelectItem>
                    <SelectItem value="nba">NBA 2K25</SelectItem>
                    <SelectItem value="madden">Madden 25</SelectItem>
                    <SelectItem value="fortnite">Fortnite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by Mode */}
              <div>
                <label className="text-white text-xs sm:text-sm font-semibold mb-2 block">🕹️ Filter by Game Mode:</label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger className="w-full bg-black border border-gray-700 rounded-lg text-white py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-400">
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="ffa">Free-for-All</SelectItem>
                    <SelectItem value="killrace">Multiplayer</SelectItem>
                    <SelectItem value="tdm">Team Deathmatch</SelectItem>
                    <SelectItem value="blitz">Blitz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Placeholder for match results */}
            <div className="mt-6 sm:mt-8">
              <p className="text-center text-gray-500 text-xs sm:text-sm">
                Filtered matches will appear here based on your selections above.
              </p>
            </div>
          </div>
        </section>
      )}

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

      {/* VIP Membership Section */}
      <section className="bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-orange-500 mb-2">VIP MEMBERSHIP</h2>
          <p className="text-center text-gray-300 text-sm mb-6">
            Start your 7-day free trial and get early access to what's coming next.
          </p>

          {/* Poster */}
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/13412423-6f9e-439b-bdfe-130d9db066d8.png" 
              alt="VIP Membership Poster" 
              className="rounded-xl shadow-lg w-full max-w-sm sm:max-w-md" 
            />
          </div>

          {/* Pricing + Benefits */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-white shadow-md max-w-md mx-auto">
            <div className="text-center mb-2 text-yellow-400 font-bold text-sm sm:text-base">🆓 7-DAY FREE TRIAL</div>
            <h3 className="text-lg sm:text-xl font-semibold text-center mb-2">VIP Membership</h3>
            <p className="text-center text-base sm:text-lg mb-4">$9.99/month</p>

            <ul className="text-xs sm:text-sm text-gray-200 space-y-2 mb-6">
              <li>⚡ Priority Access to Match Queue</li>
              <li>👑 VIP Badge & Recognition</li>
              <li>🏆 Sunday Showdown Advantage</li>
              <li>🚀 Early Access to $10+ Matches (Launching Soon)</li>
              <li>🗓️ Reserved Spot in Future VIP Tournaments</li>
            </ul>

            <button 
              className="bg-orange-500 hover:bg-orange-600 w-full py-2 sm:py-3 rounded text-white font-semibold text-sm sm:text-base"
              onClick={() => navigate('/start-trial')}
            >
              Start Free Trial
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              Free for 7 days, then $9.99/month. Cancel anytime. No hidden fees.<br />
              High-stakes matches are rolling out soon — VIPs get first access.
            </p>
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
          <div className="flex justify-center items-center mb-3">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?data=https://putuporshutup.online&size=200x200&margin=10" 
              alt="QR Code to PUOSU"
              className="w-32 h-32 sm:w-48 sm:h-48 border-4 border-white rounded shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/profile')}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">Visit: <br /> https://putuporshutup.online</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-4 px-4 text-center text-gray-500 text-xs">
        © 2025 Put Up or Shut Up™ – All Rights Reserved
      </footer>

      {/* Free Demo Countdown Widget */}
      <FreeDemoCountdown />
    </div>
  );
};

export default Index;