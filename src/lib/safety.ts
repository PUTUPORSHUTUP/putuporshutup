import React from "react";

// Universal null/type guards
export const s = (v: any, d = ""): string => (v == null ? d : String(v));
export const n = (v: any, d = 0): number =>
  Number.isFinite(v) ? (v as number) : (typeof v === "string" && v.trim() !== "" && Number.isFinite(+v) ? +v : d);
export const b = (v: any, d = false): boolean => (typeof v === "boolean" ? v : d);
export const a = <T>(v: any, d: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : d);

export const shortId = (id: any): string => {
  const x = s(id, "");
  return x ? x.slice(0, 8) : "—";
};

// Error boundary types
interface EBProps { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}

interface EBState { 
  hasError: boolean; 
  err?: any; 
}

// Global error boundary
export class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: any): EBState {
    return { hasError: true, err };
  }

  componentDidCatch(err: any, info: any) {
    console.error("UI ErrorBoundary:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', {
        className: "p-3 rounded-xl border bg-red-50 text-red-700"
      }, "Something went wrong. Please try again.");
    }
    return this.props.children;
  }
}

// Safe Supabase RPC wrapper
export async function rpcSafe<T = any>(
  sb: any,
  fn: string,
  args?: Record<string, any>
): Promise<{ data?: T; error?: string }> {
  try {
    const { data, error } = await sb.rpc(fn, args ?? {});
    if (error) return { error: error.message ?? String(error) };
    return { data: data as T };
  } catch (e: any) {
    return { error: e?.message ?? "network_error" };
  }
}

// KPI helper
export async function fetchLast24Kpis(sb: any): Promise<{
  success_rate: number;
  payouts_count: number;
  payouts_cents: number;
}> {
  const { data, error } = await rpcSafe<Record<string, any>>(sb, "admin_kpis_last24");
  if (error) {
    console.warn("admin_kpis_last24 error:", error);
    return { success_rate: 1, payouts_count: 0, payouts_cents: 0 };
  }
  return {
    success_rate: n(data?.success_rate, 1),
    payouts_count: n(data?.payouts_count, 0),
    payouts_cents: n(data?.payouts_cents, 0),
  };
}