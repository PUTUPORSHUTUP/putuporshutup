import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VIPUpgrade } from '@/components/VIPUpgrade';
import { Wallet as WalletIcon, DollarSign } from 'lucide-react';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setBalance(null);
      } else {
        setBalance(data.wallet_balance ?? 0);
      }

      setLoading(false);
    };

    fetchWallet();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              ⚠️ You must be logged in to view your wallet.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="w-6 h-6" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading balance...</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    ${balance?.toFixed(2) ?? '0.00'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available balance for matches and tournaments
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <VIPUpgrade />
      </div>
    </div>
  );
};

export default Wallet;