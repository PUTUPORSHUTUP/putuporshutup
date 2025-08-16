// src/components/NextMatchCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNextOpenMatch, NextMatch } from "@/lib/nextMatch";

function formatCountdown(msLeft: number) {
  if (msLeft <= 0) return "00:00:00";
  const s = Math.floor(msLeft / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

interface NextMatchCardProps {
  onJoinMatch?: () => void;
}

export default function NextMatchCard({ onJoinMatch }: NextMatchCardProps) {
  const navigate = useNavigate();
  const [match, setMatch] = useState<NextMatch | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    let mounted = true;
    fetchNextOpenMatch().then((m) => mounted && setMatch(m));
    
    // Refresh match data every 30 seconds
    const matchRefreshInterval = setInterval(() => {
      if (mounted) {
        fetchNextOpenMatch().then((m) => setMatch(m));
      }
    }, 30000);
    
    const timeInterval = setInterval(() => setNow(Date.now()), 1000);
    
    return () => { 
      mounted = false; 
      clearInterval(timeInterval);
      clearInterval(matchRefreshInterval);
    };
  }, []);

  const startsAtMs = useMemo(
    () => (match?.queued_at ? new Date(match.queued_at).getTime() + 60 * 1000 : 0), // Add 1 minute for match start
    [match?.queued_at]
  );
  const msLeft = Math.max(0, startsAtMs - now);

  if (!match) {
    return (
      <section className="bg-zinc-950 py-6 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-xl font-semibold">
            🎮 Next Match: <span className="text-yellow-400">Loading...</span>
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            No live matches yet. Check back soon or trigger the first match!
          </p>
          <div className="text-center mt-4">
            <button 
              className="bg-gray-600 text-white font-bold py-3 px-6 rounded-xl shadow-md cursor-not-allowed"
              disabled
            >
              No Matches Available
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleJoinClick = () => {
    if (onJoinMatch) {
      onJoinMatch();
    } else {
      navigate('/queue');
    }
  };

  return (
    <section className="bg-zinc-950 py-6 px-4">
      <div className="max-w-3xl mx-auto text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-xl font-semibold">
            🎮 Next Match: <span className="text-green-400">{match.game_mode_key?.toUpperCase() || "COMPETITIVE"}</span>
          </h2>
          {match.vip_required ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/40">
              ${match.entry_fee} VIP
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              ${match.entry_fee} Entry
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-400 mt-2">
          ⏰ Starts in: <span className="font-mono text-green-400">{formatCountdown(msLeft)}</span>
        </p>
        
        <div className="text-center mt-4">
          <button 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors"
            onClick={handleJoinClick}
          >
            Join Match Queue
          </button>
        </div>
      </div>
    </section>
  );
}