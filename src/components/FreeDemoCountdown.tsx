import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function FreeDemoCountdown() {
  const navigate = useNavigate();
  const [label, setLabel] = useState<string>("--:--");
  const [nextAt, setNextAt] = useState<Date | null>(null);

  // Pull next start time from a view (or fallback to the top of hour/:30)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // If you created a view, use: from("next_free_match_countdown")
      // Here we compute next :00 or :30 as a fallback
      try {
        const now = new Date();
        const m = now.getMinutes();
        const nextMinutes = m < 30 ? 30 : 60;
        const next = new Date(now);
        next.setMinutes(nextMinutes, 0, 0);
        if (mounted) setNextAt(next);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!nextAt) return;
    const id = window.setInterval(() => {
      const diff = Math.max(0, Math.floor((+nextAt - Date.now()) / 1000));
      const mm = String(Math.floor(diff / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      setLabel(`${mm}:${ss}`);
      if (diff === 0) {
        // tick to next slot (:00 or :30)
        const n = new Date();
        const m = n.getMinutes();
        const nextMinutes = m < 30 ? 30 : 60;
        const next = new Date(n);
        next.setMinutes(nextMinutes, 0, 0);
        setNextAt(next);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [nextAt]);

  const go = () => navigate("/queue");

  return (
    <div className="fixed bottom-3 right-3 bg-background/95 backdrop-blur border border-border rounded-xl p-3 shadow-lg w-[280px] z-40">
      <div className="text-sm text-muted-foreground">🎮 Free Multiplayer Demo</div>
      <div className="text-3xl font-bold mt-1 text-foreground">{label}</div>
      <button
        onClick={go}
        className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors"
      >
        Join Demo Queue
      </button>
      <div className="text-[11px] text-muted-foreground mt-2">
        Starts every :00 and :30 • No entry fee
      </div>
    </div>
  );
}