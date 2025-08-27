import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  CreditCard,
  Loader2
} from 'lucide-react';

export const StreamlinedWallet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (profile?.wallet_balance) {
      setBalance(profile.wallet_balance);
    }
  }, [profile]);

  const quickAmounts = [10, 25, 50, 100];

  const handleDeposit = async (amount?: number) => {
    const depositValue = amount || parseFloat(depositAmount);
    if (!user || !depositValue || depositValue < 5) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $5.00",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: depositValue,
          totalCharge: depositValue + (depositValue * 0.029) + 0.30, // Include fees
          platformFee: (depositValue * 0.029) + 0.30
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Complete your deposit in the new tab",
        });
      }
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDepositAmount('');
    }
  };

  const handleWithdraw = async () => {
    const withdrawValue = parseFloat(withdrawAmount);
    if (!user || !withdrawValue || withdrawValue < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is $10.00",
        variant: "destructive",
      });
      return;
    }

    if (withdrawValue > balance) {
      toast({
        title: "Insufficient Funds",
        description: "Cannot withdraw more than your balance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('create-withdrawal', {
        body: { amount: withdrawValue },
      });

      if (error) throw error;

      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal will be processed within 1-3 business days",
      });
      setWithdrawAmount('');
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Ready to Play
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <ArrowUpRight className="h-5 w-5" />
              Add Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => handleDeposit(amount)}
                  disabled={loading}
                  className="h-12"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  {amount}
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label>Custom Amount</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-10"
                    min="5"
                    step="0.01"
                  />
                </div>
                <Button 
                  onClick={() => handleDeposit()}
                  disabled={loading || !depositAmount || parseFloat(depositAmount) < 5}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min: $5 • Processing: ~2.9% + $0.30
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <ArrowDownRight className="h-5 w-5" />
              Withdraw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Withdrawal Amount</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pl-10"
                    min="10"
                    max={balance}
                    step="0.01"
                  />
                </div>
                <Button 
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min: $10 • Processing: 1-3 business days • No fees
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Available to withdraw:</span>
                <span className="font-medium">${balance.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};