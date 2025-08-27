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
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  payment_intent_id?: string;
}

export const StreamlinedWallet = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (profile?.wallet_balance) {
      setBalance(profile.wallet_balance);
    }
  }, [profile]);

  // Load transaction history
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

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

    if (depositValue > 10000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum deposit amount is $10,000",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-deposit', {
        body: {
          amount: depositValue,
          description: `Gaming wallet deposit - $${depositValue}`
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        toast({
          title: "Redirecting to Payment",
          description: `Processing $${depositValue} deposit...`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message || "Please try again or contact support",
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

    setWithdrawLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-withdrawal', {
        body: { 
          amount: withdrawValue,
          method: 'instant',
          account_details: { type: 'gaming_wallet' }
        },
      });

      if (error) throw error;

      toast({
        title: "Withdrawal Successful",    
        description: `$${withdrawValue} has been processed`,
      });
      
      // Update local balance and reload transactions
      setBalance(data.new_balance);
      setWithdrawAmount('');
      loadTransactions();

    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'deposit' || type === 'prize') return 'text-green-600';
    if (type === 'withdrawal' || type === 'entry_fee') return 'text-red-600';
    return amount > 0 ? 'text-green-600' : 'text-red-600';
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ready to Play
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadTransactions}
                  disabled={loadingTransactions}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                </Button>
              </div>
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
                  disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                  variant="outline"
                >
                  {withdrawLoading ? (
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

      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No transactions yet. Make your first deposit to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="font-medium capitalize">
                        {transaction.type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 
                              transaction.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};