import { CheckCircle2, Rocket, AlertCircle } from "lucide-react";

const s = (v: any, d = "") => (v == null ? d : String(v));
const n = (v: any, d = 0) => (Number.isFinite(v) ? v : Number(v) || d);
const shortId = (id: any) => (s(id).slice(0, 8) || "—");

export default function MarketLogPretty({ result }: { result: any }) {
  const cid = shortId(result?.challenge_id);
  const p = n(result?.players_paired);
  const pot = (n(result?.pot_cents) / 100).toFixed(2);
  const pays = n(result?.paid_rows);
  const secs = Math.max(0, Math.round(n(result?.duration_ms) / 1000));

  if (result?.status !== "success") {
    // Fallback for non-success lines
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-muted-foreground">
          {result?.status === "no_players" ? "No eligible players" :
           result?.reason ? `Error: ${result.reason}` : "Run completed"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      <span className="font-semibold">DATABASE MARKET SUCCESS:</span>
      <span className="text-green-400">Challenge {cid}</span>
      <span className="text-blue-300">{p}p</span>
      <span className="text-yellow-400">${pot}</span>
      <span className="text-purple-400">{pays} payouts</span>
      <span className="text-orange-400">{secs}s</span>
    </div>
  );
}