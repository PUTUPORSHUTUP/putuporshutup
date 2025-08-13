import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function JoinQueueButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ok, setOk] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return; // let /queue handle auth redirect
      const { data } = await supabase
        .from("profiles")
        .select("xbox_gamertag, wallet_balance")
        .eq("user_id", user.id)
        .maybeSingle();
      // allow click but we'll smart-redirect if missing reqs
      setOk(Boolean(data));
    })();
  }, [user]);

  const handleClick = async () => {
    // soft gate: verify basics before entering queue
    if (!user) return navigate("/auth?next=/queue");
    const { data } = await supabase
      .from("profiles")
      .select("xbox_gamertag, wallet_balance, is_vip")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data?.xbox_gamertag) return navigate("/profile?verify=gamertag&next=/queue");
    
    // Check if they can join any match (including $1 matches)
    if ((data?.wallet_balance ?? 0) < 1) {
      return navigate("/wallet?topup=1&next=/queue");
    }
    navigate("/queue");
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg font-bold"
      aria-disabled={!ok}
    >
      Join Match Queue
    </button>
  );
}