import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, DollarSign, Users, Timer, RefreshCcw, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * LiveEventsMonitor
 * - Single component for Admin + Public views
 * - Auto-refreshes
 * - Graceful loading/errors
 *
 * Props
 *  - isAdmin: boolean
 *  - refreshMs?: number (default 20000)
 */
export function LiveEventsMonitor({ isAdmin = false, refreshMs = 20000 }: { isAdmin?: boolean; refreshMs?: number }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ts, setTs] = useState<number>(Date.now());

  async function fetchEvents() {
    try {
      setError(null);
      // Use the RPC functions we just created
      const rpcName = isAdmin ? "live_events_list_admin" : "live_events_list_public";
      const { data, error } = await supabase.rpc(rpcName);
      if (error) throw error;
      setEvents(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("live_events fetch error:", e);
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
      setTs(Date.now());
    }
  }

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, refreshMs]);

  const totalSummary = useMemo(() => {
    const players = events.reduce((s, e) => s + (Number(e.players) || 0), 0);
    const poolCents = events.reduce((s, e) => s + (Number(e.prize_pool_cents) || 0), 0);
    return { players, poolCents };
  }, [events]);

  async function handleAdmin(ev: any, action: 'refund' | 'payout') {
    try {
      const fn = action === 'refund' ? 'admin_event_force_refund' : 'admin_event_force_payout';
      const { error } = await supabase.rpc(fn, { p_event_id: ev.id });
      if (error) throw error;
      fetchEvents();
    } catch (e: any) {
      setError(e?.message ?? 'Admin action failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Live Events Monitor</h2>
          <p className="text-sm text-muted-foreground">Real-time status for active & upcoming events • Updated {new Date(ts).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchEvents} className="gap-2"><RefreshCcw className="h-4 w-4" />Refresh</Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5" />
            <div>
              <div className="text-xs text-muted-foreground">Players Registered</div>
              <div className="text-xl font-semibold">{totalSummary.players}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5" />
            <div>
              <div className="text-xs text-muted-foreground">Total Prize Pool</div>
              <div className="text-xl font-semibold">${(totalSummary.poolCents / 100).toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <Timer className="h-5 w-5" />
            <div>
              <div className="text-xs text-muted-foreground">Events Live</div>
              <div className="text-xl font-semibold">{events.filter(e => e.status === 'in_progress').length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading / Error */}
      {loading && (
        <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">Loading live events…</CardContent></Card>
      )}
      {error && (
        <Card className="rounded-2xl border-destructive/40"><CardContent className="p-4 flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" /> {error}</CardContent></Card>
      )}

      {/* Events */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev, idx) => (
          <div key={ev.id ?? idx} className="animate-in fade-in-50 duration-300">
            <Card className="rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ev.title ?? 'Untitled Event'}</CardTitle>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="text-xs text-muted-foreground">{ev.mode_label ?? ev.mode_key}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {ev.players}/{ev.max_players}</div>
                  <div className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> ${(ev.prize_pool_cents / 100).toFixed(2)}</div>
                </div>
                <Progress value={Math.min(100, (Number(ev.players) || 0) / Math.max(1, Number(ev.max_players) || 1) * 100)} />
                <div className="text-xs text-muted-foreground">Entry: ${((Number(ev.entry_fee_cents) || 0) / 100).toFixed(2)} • {ev.payout_label ?? 'Winner Takes All'}</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Starts: {fmtTime(ev.starts_at)}{ev.ends_at ? ` • Ends: ${fmtTime(ev.ends_at)}` : ''}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => window.open(ev.public_url ?? '/', '_blank')}>View<ArrowRight className="ml-1 h-4 w-4" /></Button>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleAdmin(ev, 'refund')}>Force Refund</Button>
                        <Button size="sm" onClick={() => handleAdmin(ev, 'payout')}>Force Payout</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" | null }> = {
    open: { label: 'Registration Open', variant: "secondary" },
    in_progress: { label: 'In Progress', variant: "default" },
    finished: { label: 'Finished', variant: "outline" },
    completed: { label: 'Finished', variant: "outline" },
  };
  const s = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={s.variant as any}>{s.label}</Badge>;
}

function fmtTime(t: any) {
  if (!t) return '—';
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}