import { supabase } from "@/integrations/supabase/client";

export type DemoMatch = {
  id: string;
  game: string;
  mode: string;
  platform: string;
  state: 'active' | 'closed' | 'canceled';
  starts_at: string;
  ends_at: string | null;
};

/** Fetch the most recent ACTIVE demo match (the one users should join). */
export async function getActiveDemoMatch(): Promise<DemoMatch | null> {
  const { data, error } = await supabase
    .from('demo_matches')
    .select('id, game, mode, platform, state, starts_at, ends_at')
    .eq('state', 'active')
    .gte('starts_at', new Date(Date.now() - 5*60*1000).toISOString()) // Within last 5 minutes or future
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? {
    ...data,
    state: data.state as 'active' | 'closed' | 'canceled'
  } : null;
}

/** Quick check for wallet + gamertag (used for paid matches). */
export async function getJoinPrecheck(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_balance, xbox_gamertag')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return {
    wallet: Number(data.wallet_balance ?? 0),
    gtVerified: !!data.xbox_gamertag,
  };
}

/** Join a demo match (bypasses wallet check). */
export async function joinDemoMatch(demoMatchId: string, userId: string) {
  // Check if already joined
  const { data: existing, error: exErr } = await supabase
    .from('demo_participants')
    .select('id')
    .eq('match_id', demoMatchId)
    .eq('user_id', userId)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing) return { ok: true, already: true };

  const { error } = await supabase
    .from('demo_participants')
    .insert({ match_id: demoMatchId, user_id: userId });

  if (error) throw error;
  return { ok: true };
}