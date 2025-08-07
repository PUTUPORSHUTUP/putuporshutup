import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VIPUpgrade } from '@/components/VIPUpgrade';
import { Wallet as WalletIcon, DollarSign, TrendingUp, Activity } from 'lucide-react';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

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

      // Fetch recent payout activity
      const { data: activity } = await supabase
        .from('payout_automation_log')
        .select('*')
        .eq('winner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentActivity(activity || []);
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
              <div className="space-y-4">
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
                
                {recentActivity.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5" />
                      Recent Winnings
                    </h3>
                    <div className="space-y-2">
                      {recentActivity.map((activity: any) => (
                        <div key={activity.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-600">
                              +${activity.payout_amount?.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Match payout • {new Date(activity.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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