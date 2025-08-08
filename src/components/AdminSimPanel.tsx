import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Log = { ts: string; msg: string };

export default function AdminSimPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  // Safer invoker: use Supabase SDK; fall back to raw fetch ONLY if needed
  const invokeSimRunner = async (payload: any) => {
    // Preferred: SDK invoke (handles auth/CORS)
    const { data, error } = await supabase.functions.invoke("sim_runner", { body: payload });

    if (!error && data) return data;

    // Fallback: raw fetch (log HTML if received)
    try {
      const url = `https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/sim_runner`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Optional: pass anon key if your function checks it
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(
          `Bad JSON from server (status ${res.status}): ${text.slice(0, 120)}…`
        );
      }
    } catch (e: any) {
      throw new Error(error?.message || e?.message || "Unknown invoke error");
    }
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

  useEffect(() => () => stopLoop(), []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4 text-white">
      <h3 className="font-bold text-xl">🧪 Simulation Runner</h3>
      <p className="text-sm text-neutral-300">
        Mode: <b>Multiplayer</b> • Payout: <b>Top 3 (50/30/20)</b> • Platform fee: <b>10%</b>
      </p>

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