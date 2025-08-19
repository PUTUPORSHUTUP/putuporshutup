import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type MatchRow = {
  id: string;
  game_mode_key: string | null;
  entry_fee: number | null;
  vip_required: boolean | null;
  payout_type: string | null;
  queued_at: string | null;
};

export default function IndexPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // status strip
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [nextMatches, setNextMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  // user mini
  const balance = profile?.wallet_balance || 0;
  const gamertag = profile?.xbox_gamertag;
  const isAdmin = profile?.is_admin || false;

  // ---- load system status + next matches
  useEffect(() => {
    (async () => {
      // ping DB by reading one row; if it works, DB is reachable
      const { error: pingErr } = await supabase
        .from("match_queue")
        .select("id")
        .limit(1)
        .maybeSingle();
      setDbOk(!pingErr);

      const { data } = await supabase
        .from("match_queue")
        .select("id, game_mode_key, entry_fee, vip_required, payout_type, queued_at")
        .eq("automated", true)
        .eq("queue_status", "searching")
        .order("queued_at", { ascending: true })
        .limit(3);

      setNextMatches(data || []);
      setLoading(false);
    })();
  }, []);

  const needsFunds = (balance || 0) < 1; // lowest tier is $1
  const needsGamertag = !gamertag || gamertag.trim() === "";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* System Ready strip */}
      <div className="w-full px-4 py-2 text-sm flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded ${dbOk ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"}`}>
          <span className={`w-2 h-2 rounded-full ${dbOk ? "bg-emerald-400" : "bg-red-400"}`} />
          {dbOk ? "DB Connected" : "DB Error"}
        </span>
        <span className="text-neutral-400">Automated rotation active (shows upcoming matches below)</span>
      </div>

      {/* SmartBanner */}
      {(needsFunds || needsGamertag) && (
        <div className="bg-amber-900/60 border border-amber-700 text-amber-100 px-4 py-3 text-sm flex items-center justify-between">
          <div className="space-x-3">
            {needsGamertag && <span>⚠️ Link your Xbox gamertag</span>}
            {needsFunds && <span>💳 Add funds to wallet</span>}
          </div>
          <div className="space-x-2">
            {needsGamertag && <Link to="/profile" className="underline">Profile</Link>}
            {needsFunds && <Link to="/wallet" className="underline">Wallet</Link>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">PUOSU</h1>
        <div className="text-sm text-neutral-300">
          {user ? (
            <span>Balance: ${Number(balance ?? 0).toFixed(2)} · {gamertag ? `GT: ${gamertag}` : "Gamertag not linked"}</span>
          ) : (
            <Link to="/auth" className="underline">Sign in</Link>
          )}
        </div>
      </div>

      {/* Next Matches */}
      <section className="px-4">
        <h2 className="text-xl font-semibold mb-3">Next Matches</h2>
        {loading ? (
          <div className="text-neutral-400">Loading…</div>
        ) : nextMatches.length === 0 ? (
          <div className="text-neutral-400">No scheduled matches yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nextMatches.map((m) => {
              const when = m.queued_at ? new Date(m.queued_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "TBD";
              return (
                <div key={m.id} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
                  <div className="text-sm text-neutral-400 mb-1">{when}</div>
                  <div className="text-lg font-medium">
                    ${m.entry_fee ?? 0} {m.vip_required ? "VIP" : "Open"}
                  </div>
                  <div className="text-neutral-300">{m.game_mode_key || "competitive"}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Payout: {m.payout_type?.replace(/_/g, " ") || "winner take all"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Admin Shortcut */}
      {isAdmin && (
        <div className="px-4 mt-6">
          <Link to="/admin/sim" className="inline-block bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">
            🧪 Open Simulation Panel
          </Link>
        </div>
      )}

      {/* Footer Notice (Stripe/Tilled info or ops notes) */}
      <div className="px-4 py-6">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300">
          <p className="font-semibold mb-1">Operations Notice</p>
          <p>PUOSU is fully automated for match rotation, wallet accounting, and payouts/refunds. Payment processing is migrating to Tilled. VIP-only $10 matches appear every third slot.</p>
        </div>
      </div>
    </div>
  );
}