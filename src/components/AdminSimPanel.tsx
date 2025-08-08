import React, { useEffect, useRef, useState } from "react";

type Log = { ts: string; msg: string };

const call = async (path: string, body?: any) => {
  const res = await fetch(`/functions/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

export default function AdminSimPanel() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);
  const intervalMs = 8 * 60 * 1000; // 8 minutes

  const push = (msg: string) =>
    setLogs((l) => [{ ts: new Date().toLocaleTimeString(), msg }, ...l].slice(0, 200));

  const runOnce = async () => {
    if (busy) return;
    setBusy(true);
    push("▶ Starting simulation run…");

    try {
      // kick the sim runner (Multiplayer, TOP_3, 10% fee—already set in function)
      const data = await call("sim_runner", { manual: true });
      if (data?.ok) {
        push(`✅ Completed: match=${data.challengeId ?? "n/a"} crashed=${String(data.crashed)}`);
      } else {
        push(`❌ Error: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      push(`❌ Exception: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  // Start/stop auto loop
  const startLoop = () => {
    if (timerRef.current) return;
    setRunning(true);
    setCountdown(intervalMs / 1000);
    // fire immediately once
    runOnce();

    // tick countdown every second
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return Math.floor(intervalMs / 1000);
        return c - 1;
      });
    }, 1000) as unknown as number;

    // schedule run every 8 minutes
    const id = window.setInterval(() => {
      runOnce();
    }, intervalMs) as unknown as number;

    // stash one id; we'll clear both on stop
    timerRef.current = id;

    // store the tick id on window to clear later (simple)
    (window as any).__simTick = tick;
  };

  const stopLoop = () => {
    setRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if ((window as any).__simTick) {
      window.clearInterval((window as any).__simTick);
      (window as any).__simTick = null;
    }
    setCountdown(0);
    push("⏹ Auto-run stopped.");
  };

  useEffect(() => {
    return () => stopLoop(); // cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div key={i}>
            <span className="text-neutral-500">{l.ts}</span> — {l.msg}
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Heads-up: client auto-run works only while this page is open. For true background runs, use the server cron below.
      </p>
    </div>
  );
}