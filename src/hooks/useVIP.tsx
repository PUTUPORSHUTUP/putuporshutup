import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface VIPStatus {
  is_vip: boolean;
  is_vip_trial: boolean;
  vip_trial_start: string | null;
  is_premium: boolean;
  trial_days_remaining: number | null;
}

interface UseVIPReturn {
  vipStatus: VIPStatus | null;
  isLoading: boolean;
  error: string | null;
  startVIPTrial: () => Promise<boolean>;
  refreshVIPStatus: () => Promise<void>;
}

export const useVIP = (): UseVIPReturn => {
  const [vipStatus, setVipStatus] = useState<VIPStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVIPStatus = async () => {
    if (!user) {
      setVipStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('is_vip, is_vip_trial, vip_trial_start, is_premium, trial_start')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Calculate trial days remaining
        let trial_days_remaining = null;
        const trialStart = data.vip_trial_start || data.trial_start;
        
        if (data.is_vip_trial && trialStart) {
          const trialStartDate = new Date(trialStart);
          const now = new Date();
          const daysSinceStart = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
          trial_days_remaining = Math.max(0, 7 - daysSinceStart);
        }

        setVipStatus({
          is_vip: data.is_vip || false,
          is_vip_trial: data.is_vip_trial || false,
          vip_trial_start: data.vip_trial_start,
          is_premium: data.is_premium || false,
          trial_days_remaining
        });
      } else {
        setVipStatus(null);
      }
    } catch (err) {
      console.error('Error fetching VIP status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch VIP status');
    } finally {
      setIsLoading(false);
    }
  };

  const startVIPTrial = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to start a VIP trial.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.rpc('start_vip_trial_v2', {
        user_id_param: user.id
      });

      if (error) throw error;

      toast({
        title: "VIP Trial Started!",
        description: "You now have 7 days of VIP access. Enjoy premium features!",
      });

      // Refresh VIP status
      await fetchVIPStatus();
      return true;

    } catch (err) {
      console.error('Error starting VIP trial:', err);
      toast({
        title: "Error",
        description: "Failed to start VIP trial. You may have already used your trial.",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshVIPStatus = async () => {
    await fetchVIPStatus();
  };

  useEffect(() => {
    fetchVIPStatus();
  }, [user]);

  return {
    vipStatus,
    isLoading,
    error,
    startVIPTrial,
    refreshVIPStatus
  };
};