import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2 
} from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RjSrZQ29zUP69L93G4LjSsPrbpuREzy2zfy4vwBB7a7ycqCBkPRcPb4lBL4fpLO1DH7JNGoDfmLiznqMlqExpo600extcImi0";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'wager_payout' | 'wager_fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  description?: string;
}

interface PaymentComponentProps {
  balance: number;
  onBalanceUpdate: () => void;
}

export const PaymentComponent = ({ balance, onBalanceUpdate }: PaymentComponentProps) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

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

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions((data || []) as Transaction[]);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;
    
    const amount = parseFloat(depositAmount);
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $1.00",
        variant: "destructive",
      });
      return;
    }

    setProcessingDeposit(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: { amount }
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.open(data.url, '_blank');
        setDepositAmount('');
        
        toast({
          title: "Redirecting to Payment",
          description: "Complete your payment in the new tab to add funds.",
        });
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment request.",
        variant: "destructive",
      });
    } finally {
      setProcessingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return;
    
    const amount = parseFloat(withdrawAmount);
    if (amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is $10.00",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Funds",
        description: "Withdrawal amount exceeds available balance.",
        variant: "destructive",
      });
      return;
    }

    setProcessingWithdraw(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-withdrawal', {
        body: { amount }
      });

      if (error) {
        toast({
          title: "Withdrawal Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Withdrawal Requested",
        description: `$${amount} withdrawal request submitted. Processing may take 1-3 business days.`,
      });

      setWithdrawAmount('');
      onBalanceUpdate();
      loadTransactions();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Error",
        description: "Unable to process withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setProcessingWithdraw(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'wager_payout':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            PAYMENT CENTER
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="text-center p-6 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <p className="text-3xl font-gaming text-green-600">${balance.toFixed(2)}</p>
            <p className="text-muted-foreground">Available Balance</p>
          </div>
          
          {/* Deposit Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deposit Funds</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="25.00"
                className="flex-1"
              />
              <Button 
                onClick={handleDeposit}
                disabled={processingDeposit || !depositAmount}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingDeposit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Deposit
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Secure payments powered by Stripe. Minimum $1.00
            </p>
          </div>

          {/* Withdrawal Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Withdraw Funds</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="10"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                className="flex-1"
              />
              <Button 
                onClick={handleWithdraw}
                disabled={processingWithdraw || !withdrawAmount || balance < 10}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                {processingWithdraw ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Processing takes 1-3 business days. Minimum $10.00
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            TRANSACTION HISTORY
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadTransactions}
            disabled={loadingTransactions}
          >
            {loadingTransactions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Make your first deposit to get started!</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <p className="font-medium capitalize">
                        {transaction.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'deposit' || transaction.type === 'wager_payout' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'wager_payout' ? '+' : '-'}
                      ${transaction.amount}
                    </p>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(transaction.status)}
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};