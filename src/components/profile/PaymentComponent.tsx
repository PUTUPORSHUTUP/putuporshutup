import { useState, useEffect } from 'react';
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
  Loader2,
  Crown,
  Info
} from 'lucide-react';
import { calculateDepositFee, getFeeStructure, PREMIUM_MONTHLY_COST } from '@/lib/feeCalculator';
import { TilledBadge } from '@/components/ui/tilled-badge';

const TILLED_PUBLISHABLE_KEY = "pk_sandbox_1234567890PUOSU"; // Will be replaced with actual Tilled key

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
  isPremiumUser?: boolean;
}

export const PaymentComponent = ({ balance, onBalanceUpdate, isPremiumUser = false }: PaymentComponentProps) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Load transactions on component mount
  useEffect(() => {
    loadTransactions();
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

    const feeCalculation = calculateDepositFee(amount, isPremiumUser ? 'basic' : 'none');

    setProcessingDeposit(true);
    try {
      // Using Tilled sandbox integration with dynamic amount and mock payment method
      const { data, error } = await supabase.functions.invoke('create-tilled-payment', {
        body: { 
          amount: feeCalculation.amountToWallet,
          totalCharge: feeCalculation.totalCharge,
          platformFee: feeCalculation.platformFee,
          challengeId: 'wallet_deposit', // Dynamic challenge ID will be added later
          type: 'wallet_deposit'
        }
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Handle Tilled payment response
      if (data.success) {
        setDepositAmount('');
        onBalanceUpdate();
        loadTransactions();
        
        toast({
          title: "Payment Successful!",
          description: `$${feeCalculation.amountToWallet.toFixed(2)} has been added to your wallet.`,
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
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is $1.00",
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
      const { data, error } = await supabase.functions.invoke('instant-withdrawal', {
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
        title: "Instant Withdrawal Complete!",
        description: `$${amount} has been withdrawn instantly to your account.`,
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

  // Calculate fee preview for current deposit amount
  const feePreview = depositAmount ? calculateDepositFee(parseFloat(depositAmount) || 0, isPremiumUser ? 'basic' : 'none') : null;
  const feeStructure = getFeeStructure();

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">${balance.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Available Balance</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-xl font-bold text-green-600">
              {transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length}
            </p>
            <p className="text-sm text-muted-foreground">Successful Deposits</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-xl font-bold text-blue-600">
              {transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').length}
            </p>
            <p className="text-sm text-muted-foreground">Successful Withdrawals</p>
          </CardContent>
        </Card>
      </div>

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
          {/* Premium Status */}
          {isPremiumUser && (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg">
              <Crown className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-yellow-600">Premium Member</p>
              <p className="text-xs text-muted-foreground">50% off all deposit fees!</p>
            </div>
          )}
          
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

            {/* Fee Preview */}
            {feePreview && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deposit Amount:</span>
                  <span>${feePreview.depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee ({feePreview.platformFeePercentage}%):</span>
                  <span>${feePreview.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Total Charge:</span>
                  <span>${feePreview.totalCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Added to Wallet:</span>
                  <span>${feePreview.amountToWallet.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Fee Structure Info */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                View Fee Structure
              </summary>
              <div className="mt-2 p-3 bg-muted rounded space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  <span>Deposit Range</span>
                  <span>Standard Fee</span>
                  <span>Premium Fee</span>
                </div>
                {feeStructure.map((tier, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                    <span>{tier.range}</span>
                    <span>{tier.fee}</span>
                    <span className="text-yellow-600">{tier.premiumFee}</span>
                  </div>
                ))}
                {!isPremiumUser && (
                  <div className="mt-2 pt-2 border-t text-center">
                    <p className="text-xs text-muted-foreground">
                      Upgrade to Premium for 50% off all fees + exclusive tournaments!
                    </p>
                  </div>
                )}
              </div>
            </details>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Minimum $1.00
              </p>
              <TilledBadge variant="compact" />
            </div>
          </div>

          {/* Withdrawal Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Withdraw Funds</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="1"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                className="flex-1"
              />
              <Button 
                onClick={handleWithdraw}
                disabled={processingWithdraw || !withdrawAmount || balance < 1}
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
              ⚡ Instant withdrawal to your bank account. Minimum $1.00
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
    </div>
  );
};