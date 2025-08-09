import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLast24Kpis, n } from "@/lib/safety";

interface KpiData {
  success_rate: number;
  payouts_count: number;
  payouts_cents: number;
}

export function AdminKpiChips() {
  const [kpis, setKpis] = useState<KpiData>({ success_rate: 1, payouts_count: 0, payouts_cents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const data = await fetchLast24Kpis(supabase);
        setKpis(data);
      } catch (error) {
        console.error("Failed to load KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadKpis();
    // Refresh every 30 seconds
    const interval = setInterval(loadKpis, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 rounded-xl shadow-sm bg-card border animate-pulse">
            <div className="h-3 bg-muted rounded mb-2"></div>
            <div className="h-6 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const ratePct = (n(kpis.success_rate) * 100).toFixed(1);
  const payoutsUsd = (n(kpis.payouts_cents) / 100).toFixed(2);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 rounded-xl shadow-sm bg-card border">
        <div className="text-xs text-muted-foreground">Success rate (24h)</div>
        <div className="text-2xl font-semibold">{ratePct}%</div>
      </div>
      <div className="p-3 rounded-xl shadow-sm bg-card border">
        <div className="text-xs text-muted-foreground">Payouts (24h)</div>
        <div className="text-2xl font-semibold">${payoutsUsd}</div>
      </div>
      <div className="p-3 rounded-xl shadow-sm bg-card border">
        <div className="text-xs text-muted-foreground">Payout count (24h)</div>
        <div className="text-2xl font-semibold">{n(kpis.payouts_count)}</div>
      </div>
    </div>
  );
}