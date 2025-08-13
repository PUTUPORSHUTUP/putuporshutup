import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Tier = { label: string; entry: number; vip: boolean };

const TIERS: Tier[] = [
  { label: "$1 Open",  entry: 1,  vip: false },
  { label: "$5 Open",  entry: 5,  vip: false },
  { label: "$10 VIP",  entry: 10, vip: true  },
];

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Get rotation index
    let idx = 0;
    const { data: stateData } = await supabase
      .from('match_cycle_state')
      .select('idx')
      .eq('id', 1)
      .single();
    
    idx = stateData?.idx ?? 0;

    // 2) Pick tier
    const tier = TIERS[idx % TIERS.length];

    // 3) Create the next match
    const now = new Date();
    const startsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const expiresAt = new Date(now.getTime() + 40 * 60 * 1000); // 40 minutes from now

    const payload = {
      status: "open",
      game: "Call of Duty",
      mode: "Multiplayer", 
      payout_type: "winner_take_all",
      entry_fee: tier.entry,
      vip_required: tier.vip,
      automated: true,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      capacity: 100,
    };

    const { error: insertError } = await supabase
      .from('match_queue')
      .insert(payload);

    if (insertError) throw insertError;

    // 4) Advance pointer
    const nextIdx = (idx + 1) % TIERS.length;
    const { error: updateError } = await supabase
      .from('match_cycle_state')
      .update({ 
        idx: nextIdx, 
        last_created: new Date().toISOString() 
      })
      .eq('id', 1);

    if (updateError) throw updateError;

    console.log(`Created ${tier.label} match, next: ${TIERS[nextIdx].label}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        created: payload, 
        nextIdx,
        nextTier: TIERS[nextIdx].label 
      }), 
      { 
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (e) {
    console.error('Auto cycle matches error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});