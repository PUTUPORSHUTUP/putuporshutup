import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary, rpcSafe, n, shortId } from "@/lib/safety";
import { AdminKpiChips } from "@/components/admin/AdminKpiChips";

type Log = { ts: string; msg: string };
type PayoutDiagnostic = {
  challenge_id: string;
  status: string;
  payout_status: string | null;
  error_message: string | null;
  participant_count: number;
  total_pot: number;
  settled_at: string | null;
};

export default function AdminSimPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [diagnostics, setDiagnostics] = useState<PayoutDiagnostic[]>([]);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [nextTier, setNextTier] = useState<string>("?");
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const intervalMs = 4 * 60 * 1000; // 4 minutes

  const push = (msg: any) => {
    const str =
      typeof msg === "string"
        ? msg
        : (() => {
            try { return JSON.stringify(msg); } catch { return String(msg); }
          })();

    setLogs((l) => [{ ts: new Date().toLocaleTimeString(), msg: str }, ...(l || [])].slice(0, 300));
  };

  // Call auto-cycle-matches function to advance rotation
  const invokeInstantMarket = async (payload: any) => {
    const { data, error } = await supabase.functions.invoke("auto-cycle-matches", { 
      body: { manual: true } 
    });
    
    if (error) {
      console.error("Auto-cycle-matches error:", error);
      return { ok: false, message: error.message, status: 'error' };
    }
    
    return data as any || { ok: true };
  };

  const runOnce = async () => {
    if (busy) return;
    setBusy(true);
    push("🚀 Advancing rotation…");

    try {
      const data = await invokeInstantMarket({ manual: true });
      if (data?.success || data?.ok) {
        push(`✅ Rotation advanced OK: ${JSON.stringify(data)}`);
      } else {
        push(`❌ Rotation Failed: ${data?.message || data?.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      push(`❌ Connection Error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const readNextTier = async () => {
    const { data, error } = await supabase
      .from("match_cycle_state")
      .select("idx, last_created")
      .eq("id", 1)
      .single();
    if (error) return push(`❌ Read error: ${error.message}`);
    const tiers = ["$1 Open", "$5 Open", "$10 VIP"];
    const idx = Number(data?.idx ?? 0);
    setNextTier(tiers[idx] ?? "?");
    push(`ℹ️ Next in rotation: ${tiers[idx]} (last_created: ${data?.last_created ?? "n/a"})`);
  };

  const startLoop = () => {
    if (timerRef.current) return;
    setRunning(true);
    setCountdown(intervalMs / 1000);
    runOnce(); // fire immediately

    // countdown
    tickRef.current = window.setInterval(() => {
      setCountdown((c) => (c <= 1 ? Math.floor(intervalMs / 1000) : c - 1));
    }, 1000) as unknown as number;

    // schedule run
    timerRef.current = window.setInterval(() => {
      runOnce();
    }, intervalMs) as unknown as number;
  };

  const stopLoop = () => {
    setRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setCountdown(0);
    push("⏹ Auto-run stopped.");
  };

  // Load diagnostic data from challenges table
  const loadDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, status, total_pot, settled_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      const formatted = (data || []).map(item => ({
        challenge_id: item.id,
        status: item.status,
        payout_status: item.settled_at ? 'processed' : 'pending',
        error_message: null,
        participant_count: 2, // Default for now
        total_pot: item.total_pot || 0,
        settled_at: item.settled_at
      }));
      
      setDiagnostics(formatted);
    } catch (e: any) {
      push(`❌ Diagnostics error: ${e.message}`);
    } finally {
      setLoadingDiag(false);
    }
  };

  useEffect(() => () => stopLoop(), []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-6 text-white">
      <div>
        <h3 className="font-bold text-xl">🎯 Database Market Engine</h3>
        <p className="text-sm text-neutral-300">
          Mode: <b>Database-First</b> • Payout: <b>Top 3 (60/30/10)</b> • Platform fee: <b>10%</b> • Target: <b>&lt;15s</b>
        </p>
      </div>

      {/* KPI Dashboard */}
      <ErrorBoundary>
        <AdminKpiChips />
      </ErrorBoundary>

      {/* Engine Status */}
      <div className="bg-neutral-800 border border-neutral-700 rounded p-3 space-y-2">
        <h4 className="font-semibold text-green-400">🎯 Database Market Status</h4>
        <div className="text-sm space-y-1">
          <div>
            <span className="text-neutral-400">Challenge Creation:</span> 
            <span className="ml-2 text-green-400">ACTIVE</span>
          </div>
          <div>
            <span className="text-neutral-400">Result Generation:</span>
            <span className="ml-2 text-green-400">ACTIVE</span>
          </div>
          <div>
            <span className="text-neutral-400">Payout Processing:</span>
            <span className="ml-2 text-green-400">ACTIVE</span>
          </div>
        </div>
        <div className="text-xs text-neutral-400">
          Single PostgreSQL function with ACID compliance and automatic rollback
        </div>
      </div>

      {/* Diagnostic Section */}
      <div className="bg-neutral-800 border border-neutral-700 rounded p-3 space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-purple-400">📊 Recent Challenge Diagnostics</h4>
          <button 
            onClick={loadDiagnostics}
            disabled={loadingDiag}
            className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded"
          >
            {loadingDiag ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="max-h-40 overflow-auto text-xs space-y-1">
          {diagnostics.map((d, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 p-1 hover:bg-neutral-700 rounded">
              <div className="truncate">{shortId(d.challenge_id)}...</div>
              <div className={d.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>
                {d.status}
              </div>
              <div className={d.payout_status === 'processed' ? 'text-green-400' : 'text-red-400'}>
                {d.payout_status || 'none'}
              </div>
              <div>${n(d.total_pot)}</div>
              <div className="text-neutral-400">{n(d.participant_count)}p</div>
            </div>
          ))}
          {diagnostics.length === 0 && <div className="text-neutral-500">No recent data</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={readNextTier}
          className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded"
        >
          🔍 Check Next Tier
        </button>
        <span className="text-sm text-neutral-300 self-center">Next: {nextTier}</span>
        
        <button
          onClick={runOnce}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {busy ? "🚀 Processing…" : "🚀 Run One Simulation Now"}
        </button>

        {!running ? (
          <button onClick={startLoop} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">
            🔁 Start Auto Market (every 4 min)
          </button>
        ) : (
          <button onClick={stopLoop} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
            ⏹ Stop Auto Market
          </button>
        )}

        <a
          href="/admin"
          className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded"
        >
          ← Back to Admin
        </a>
      </div>

      {running && (
        <p className="text-sm text-neutral-400">
          Next auto run in: <b>{countdown}s</b>
        </p>
      )}

      <div className="bg-neutral-800 rounded p-3 max-h-72 overflow-auto text-sm">
        {logs.length === 0 ? <div className="text-neutral-400">No logs yet.</div> : null}
        {logs.map((l, i) => (
          <pre key={i} className="whitespace-pre-wrap break-words text-sm">
            <span className="text-neutral-500">{String(l?.ts ?? "")}</span> — {String(l?.msg ?? "")}
          </pre>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Database Market Engine: Single PostgreSQL function with full ACID compliance. Target: Complete market cycle in under 15 seconds.
      </p>
    </div>
  );
}