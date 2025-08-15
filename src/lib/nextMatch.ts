// src/lib/nextMatch.ts
import { supabase } from "@/integrations/supabase/client";

export type NextMatch = {
  id: string;
  game: string | null;
  mode: string | null;
  entry_fee: number;
  vip_required: boolean;
  starts_at: string;        // ISO string
  payout_type: string | null;
};

export async function fetchNextOpenMatch(): Promise<NextMatch | null> {
  const { data, error } = await supabase
    .from("match_queue")
    .select("id, game_mode_key, entry_fee, vip_required, queued_at, payout_type, queue_status, automated")
    .eq("queue_status", "searching")
    .eq("automated", true)
    .order("queued_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchNextOpenMatch error:", error);
    return null;
  }
  
  if (!data) return null;

  // Transform the data to match our NextMatch type
  return {
    id: data.id,
    game: "Call of Duty",  // Default game for now
    mode: data.game_mode_key || "Multiplayer",
    entry_fee: data.entry_fee,
    vip_required: data.vip_required,
    starts_at: data.queued_at, // Use queued_at as start time for now
    payout_type: data.payout_type
  };
}