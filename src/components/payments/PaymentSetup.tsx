import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Shield, Zap } from 'lucide-react';

const PaymentSetup = () => {
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          amount: parseFloat(depositAmount) * 100, // Convert to cents
          type: 'deposit',
          description: `Wallet deposit - $${depositAmount}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-withdrawal', {
        body: {
          amount: parseFloat(withdrawAmount),
          method: 'bank_transfer',
        },
      });

      if (error) throw error;

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal of $${withdrawAmount} has been submitted for processing.`,
      });

      setWithdrawAmount('');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast({
        title: "Withdrawal Error",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickDepositAmounts = [5, 10, 25, 50, 100];

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment & Wallet Management
          </CardTitle>
          <CardDescription>
            Manage your gaming wallet with secure deposits and instant withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Secure Payments</p>
                <p className="text-sm text-muted-foreground">Protected by Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Instant Deposits</p>
                <p className="text-sm text-muted-foreground">Funds available immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Multiple Methods</p>
                <p className="text-sm text-muted-foreground">Cards, bank transfers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <ArrowUpRight className="h-5 w-5" />
              Deposit Funds
            </CardTitle>
            <CardDescription>
              Add money to your gaming wallet to participate in wagers and tournaments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Deposit Buttons */}
            <div>
              <Label className="text-sm font-medium">Quick amounts</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {quickDepositAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                    className="h-8"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Custom amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-10"
                  min="1"
                  max="10000"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || parseFloat(depositAmount) < 5 || loading}
              className="w-full"
            >
              {loading ? "Processing..." : `Deposit $${depositAmount || "0.00"}`}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>• Minimum deposit: $5.00</p>
              <p>• Maximum deposit: $10,000.00</p>
              <p>• Processing fee: 2.9% + $0.30</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <ArrowDownRight className="h-5 w-5" />
              Withdraw Funds
            </CardTitle>
            <CardDescription>
              Transfer your winnings back to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Available Balance</span>
                <Badge variant="secondary" className="text-blue-900 bg-blue-100">
                  $0.00
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Withdrawal amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-10"
                  min="10"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) < 10 || loading}
              className="w-full"
              variant="outline"
            >
              {loading ? "Processing..." : `Withdraw $${withdrawAmount || "0.00"}`}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>• Minimum withdrawal: $10.00</p>
              <p>• Processing time: 1-3 business days</p>
              <p>• No withdrawal fees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Integration Status</CardTitle>
          <CardDescription>
            To enable payments, you'll need to configure Stripe integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <span className="font-medium">Stripe Configuration</span>
              </div>
              <Badge variant="secondary">Pending Setup</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              To enable real payments, you need to add your Stripe secret key to the project settings.
              This will allow users to make actual deposits and withdrawals.
            </p>
            
            <Button variant="outline" className="w-full" disabled>
              Configure Stripe Keys
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSetup;