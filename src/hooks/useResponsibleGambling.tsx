import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserLimit {
  limit_type: string;
  limit_amount: number;
}

interface ResponsibleGamblingState {
  isExcluded: boolean;
  exclusionMessage?: string;
  limits: UserLimit[];
  checkLimit: (type: string, amount: number) => boolean;
  loading: boolean;
}

export function useResponsibleGambling(): ResponsibleGamblingState {
  const { user } = useAuth();
  const [isExcluded, setIsExcluded] = useState(false);
  const [exclusionMessage, setExclusionMessage] = useState<string>();
  const [limits, setLimits] = useState<UserLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkExclusionStatus();
      loadUserLimits();
    }
  }, [user]);

  const checkExclusionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('self_exclusions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking exclusion status:', error);
        return;
      }

      if (data && data.length > 0) {
        const exclusion = data[0];
        const now = new Date();
        
        if (exclusion.exclusion_type === 'permanent') {
          setIsExcluded(true);
          setExclusionMessage('You have permanently excluded yourself from wagering activities.');
        } else if (exclusion.end_date && new Date(exclusion.end_date) > now) {
          setIsExcluded(true);
          setExclusionMessage(`You are temporarily excluded until ${new Date(exclusion.end_date).toLocaleDateString()}.`);
        } else {
          setIsExcluded(false);
          setExclusionMessage(undefined);
        }
      } else {
        setIsExcluded(false);
        setExclusionMessage(undefined);
      }
    } catch (error) {
      console.error('Error in checkExclusionStatus:', error);
    }
  };

  const loadUserLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_limits')
        .select('limit_type, limit_amount')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user limits:', error);
        return;
      }

      setLimits(data || []);
    } catch (error) {
      console.error('Error in loadUserLimits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = (type: string, amount: number): boolean => {
    const userLimit = limits.find(limit => limit.limit_type === type);
    if (!userLimit) return true; // No limit set, allow transaction
    
    return amount <= userLimit.limit_amount;
  };

  return {
    isExcluded,
    exclusionMessage,
    limits,
    checkLimit,
    loading
  };
}