import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const VIPUpgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgradeToVIP = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade to VIP",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-vip-payment');
      
      if (error) throw error;
      
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('VIP upgrade error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start VIP upgrade process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-black text-white px-6 py-10 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-orange-500 mb-3">Upgrade to Full VIP</h1>
      <p className="text-gray-300 text-sm mb-6">Your trial may end, but your competitive edge doesn't have to.</p>
      
      <div className="mb-6">
        <div className="text-4xl font-bold text-green-400 mb-2">$9.99</div>
        <p className="text-gray-300">One-time payment for lifetime VIP access</p>
      </div>

      <Button 
        onClick={handleUpgradeToVIP}
        disabled={loading}
        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg mb-6"
      >
        {loading ? "Processing..." : "Upgrade to VIP Now"}
      </Button>

      <div className="bg-gray-800 p-4 rounded mb-6">
        <p className="mb-2">💳 Secure payment powered by Stripe</p>
        <p className="mb-2">✅ Instant VIP activation</p>
        <p>🔒 Lifetime access to all premium features</p>
      </div>

      <div className="border-t border-gray-600 pt-6 mt-6">
        <p className="text-sm text-gray-400 mb-4">Prefer manual payment?</p>
        <div className="bg-gray-800 p-4 rounded mb-4">
          <p className="mb-2">💸 <strong>Cash App:</strong> $PUOSU</p>
          <p>💸 <strong>PayPal:</strong> paypal.me/puosu</p>
        </div>
        <p className="text-xs text-gray-400">Manual payments processed within 24 hours</p>
      </div>
    </section>
  );
};