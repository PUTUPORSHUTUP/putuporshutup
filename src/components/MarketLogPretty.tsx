import React from "react";
import { CheckCircle2, XCircle, Info, Rocket } from "lucide-react";

/**
 * MarketLogPretty
 * One drop-in renderer for Database Market Engine logs.
 * - No dangerouslySetInnerHTML
 * - Pretty color coding for success / warning / error
 * - Accepts either the structured JSON result OR a raw string
 * - Optional compact mode
 * 
 * Usage:
 * <MarketLogPretty entry={resultFromRpc} />
 * // or if you only have a raw line
 * <MarketLogPretty entry={rawString} />
 */
export default function MarketLogPretty({ entry, compact = false }: { entry: any; compact?: boolean }) {
  const data = normalize(entry);

  if (data.kind === "error") {
    return (
      <Line className="text-red-500">
        <XCircle className="h-4 w-4" />
        <span className="font-semibold">DATABASE MARKET FAILED</span>
        <span className="text-red-400">{truncate(data.reason, 180)}</span>
        <Right timeMs={data.duration_ms} />
      </Line>
    );
  }

  if (data.kind === "no_players") {
    return (
      <Line className="text-amber-500">
        <Info className="h-4 w-4" />
        <span className="font-semibold">NO ELIGIBLE PLAYERS</span>
        <span className="text-amber-400">(try again shortly)</span>
        <Right timeMs={data.duration_ms} />
      </Line>
    );
  }

  if (data.kind === "success") {
    return (
      <Line className="text-emerald-400" compact={compact}>
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-semibold">DATABASE MARKET SUCCESS:</span>
        <Color spanClass="text-green-400">Challenge {shortId(data.challenge_id)}</Color>
        <Color spanClass="text-blue-300">{num(data.players_paired)}p</Color>
        <Color spanClass="text-yellow-400">${(num(data.pot_cents)/100).toFixed(2)}</Color>
        <Color spanClass="text-purple-400">{num(data.paid_rows)} payouts</Color>
        <Color spanClass="text-orange-400">{sec(data.duration_ms)}s</Color>
      </Line>
    );
  }

  // Fallback generic line
  return (
    <Line className="text-muted-foreground">
      <Rocket className="h-4 w-4" />
      <span>{safeString(entry)}</span>
    </Line>
  );
}

// ---------- helpers ----------
function Line({ children, className = "", compact = false }: { children: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center flex-wrap gap-2 text-sm ${compact ? "" : "py-0.5"} ${className}`}>
      {children}
    </div>
  );
}

function Color({ spanClass, children }: { spanClass: string; children: React.ReactNode }) {
  return <span className={spanClass}>{children}</span>;
}

function Right({ timeMs }: { timeMs: number }) {
  return (
    <span className="text-muted-foreground text-xs ml-auto">
      {sec(timeMs)}s
    </span>
  );
}

function sec(ms: any) {
  const v = num(ms);
  return Math.max(0, Math.round(v / 1000));
}

function shortId(id: any) {
  const x = safeString(id);
  return x ? x.slice(0, 8) : "—";
}

function num(v: any, d = 0) {
  return Number.isFinite(v) ? (v as number) : Number(v) || d;
}

function safeString(v: any, d = "") {
  return v == null ? d : String(v);
}

function truncate(s: string, n = 140) {
  return s && s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Normalize various shapes into a consistent model
function normalize(entry: any):
  | { kind: "success"; challenge_id: string; players_paired: number; pot_cents: number; paid_rows: number; duration_ms: number }
  | { kind: "no_players"; duration_ms: number }
  | { kind: "error"; reason: string; duration_ms: number }
  | { kind: "other" } {
  try {
    // Structured JSON from db_market_run / db_market_run_prod
    if (entry && typeof entry === "object") {
      const status = String(entry.status ?? "");
      if (status === "success") {
        return {
          kind: "success",
          challenge_id: safeString(entry.challenge_id),
          players_paired: num(entry.players_paired),
          pot_cents: num(entry.pot_cents),
          paid_rows: num(entry.paid_rows),
          duration_ms: num(entry.duration_ms),
        };
      }
      if (status === "no_players") {
        return { kind: "no_players", duration_ms: num(entry.duration_ms) };
      }
      if (status === "error") {
        return {
          kind: "error",
          reason: safeString(entry.reason, "unknown_error"),
          duration_ms: num(entry.duration_ms)
        };
      }
    }

    // Raw string fallback
    if (typeof entry === "string") {
      const s = entry.toLowerCase();
      if (s.includes("success")) return { kind: "success", challenge_id: "", players_paired: 0, pot_cents: 0, paid_rows: 0, duration_ms: 0 };
      if (s.includes("no eligible players")) return { kind: "no_players", duration_ms: 0 };
      if (s.includes("failed") || s.includes("error")) return { kind: "error", reason: entry, duration_ms: 0 };
    }
  } catch (e) {
    // swallow and show generic
  }
  return { kind: "other" };
}

/** Optional: List renderer for a feed of entries */
export function MarketLogFeed({ entries }: { entries: any[] }) {
  return (
    <div className="space-y-1.5">
      {entries.map((e, i) => (
        <MarketLogPretty key={i} entry={e} />
      ))}
    </div>
  );
}