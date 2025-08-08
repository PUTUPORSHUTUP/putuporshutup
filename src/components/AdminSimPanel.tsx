import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";

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
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const intervalMs = 8 * 60 * 1000; // 8 minutes

  const push = (msg: any) => {
    const str =
      typeof msg === "string"
        ? msg
        : (() => {
            try { return JSON.stringify(msg); } catch { return String(msg); }
          })();

    setLogs((l) => [{ ts: new Date().toLocaleTimeString(), msg: str }, ...l].slice(0, 300));
  };

  // Use the new secure apiClient for all sim runner calls
  const invokeSimRunner = async (payload: any) => {
    const response = await apiClient.adminCall('sim_runner', payload);
    
    if (response.error) {
      console.error("Sim runner error:", response.error);
      return { ok: false, message: response.error, status: response.status };
    }
    
    return response.data || { ok: true };
  };

  const runOnce = async () => {
    if (busy) return;
    setBusy(true);
    push("▶ Starting simulation run…");

    try {
      const data = await invokeSimRunner({ manual: true });
      if (data?.ok) {
        const id = data.matchId ?? data.challengeId ?? "n/a";
        const link = id !== "n/a" ? `/admin/matches/${id}` : null;

        const crashBit = data.crashed
          ? `crashed=<b>true</b>${data.crashReason ? ` · reason=${data.crashReason}` : ""}${typeof data.refundCount === "number" ? ` · refunds=${data.refundCount}` : ""}`
          : "crashed=false";

        push(
          link
            ? `✅ Completed: match= <a href="${link}" class="underline text-blue-300" target="_blank" rel="noreferrer">${id}</a> · ${crashBit}`
            : `✅ Completed: match=${id} · ${crashBit}`
        );
      } else {
        push(`❌ Server responded but not OK: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      push({ error: e?.message || String(e) });  // no [object Object]
    } finally {
      setBusy(false);
    }
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

  // Load diagnostic data
  const loadDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const { data, error } = await apiClient.call("auth_diagnostics", { method: "GET" });
      if (error) throw new Error(error);
      setDiagnostics(data || []);
    } catch (e: any) {
      push(`❌ Diagnostics error: ${e.message}`);
    } finally {
      setLoadingDiag(false);
    }
  };

  useEffect(() => () => stopLoop(), []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-6 text-white">
      <h3 className="font-bold text-xl">🧪 Simulation Runner</h3>
      <p className="text-sm text-neutral-300">
        Mode: <b>Multiplayer</b> • Payout: <b>Top 3 (50/30/20)</b> • Platform fee: <b>10%</b>
      </p>

      {/* Environment Controls */}
      <div className="bg-neutral-800 border border-neutral-700 rounded p-3 space-y-2">
        <h4 className="font-semibold text-yellow-400">🔧 Crash Control Settings</h4>
        <div className="text-sm space-y-1">
          <div>
            <span className="text-neutral-400">SIM_FORCE_NO_CRASH:</span> 
            <span className="ml-2 text-green-400">Check function logs</span>
          </div>
          <div>
            <span className="text-neutral-400">SIM_CRASH_RATE:</span>
            <span className="ml-2 text-blue-400">Default 8%</span>
          </div>
        </div>
        <div className="text-xs text-neutral-400">
          Set <code>SIM_FORCE_NO_CRASH=1</code> in Supabase Function Settings to disable crash simulation
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
              <div className="truncate">{d.challenge_id.slice(0, 8)}...</div>
              <div className={d.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>
                {d.status}
              </div>
              <div className={d.payout_status === 'processed' ? 'text-green-400' : 'text-red-400'}>
                {d.payout_status || 'none'}
              </div>
              <div>${d.total_pot}</div>
              <div className="text-neutral-400">{d.participant_count}p</div>
            </div>
          ))}
          {diagnostics.length === 0 && <div className="text-neutral-500">No recent data</div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={runOnce}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {busy ? "Running…" : "Run One Simulation Now"}
        </button>

        {!running ? (
          <button onClick={startLoop} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">
            🔁 Start Auto-Run (every 8 min)
          </button>
        ) : (
          <button onClick={stopLoop} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
            ⏹ Stop Auto-Run
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
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: `<span class="text-neutral-500">${l.ts}</span> — ${l.msg}` }}
          />
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        If you still see HTML errors, the function URL or deployment is wrong. Confirm function name <code>sim_runner</code> is deployed.
      </p>
    </div>
  );
}