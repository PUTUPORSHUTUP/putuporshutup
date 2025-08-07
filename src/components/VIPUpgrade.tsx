import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const VIPUpgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleDepositRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a deposit",
        variant: "destructive"
      });
      return;
    }

    if (!amount || parseFloat(amount) < 5) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $5.00",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('manual_payment_requests').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        type: 'deposit',
        payment_method: paymentMethod,
        account_details: getAccountDetails(paymentMethod),
        user_notes: `Wallet deposit of $${amount} via ${paymentMethod}`
      });

      if (error) throw error;

      setShowInstructions(true);
      toast({
        title: "Deposit Request Submitted",
        description: "Please complete the payment using the instructions below",
      });
    } catch (error) {
      console.error('Deposit request error:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccountDetails = (method: string) => {
    switch (method) {
      case 'venmo': return '@PUTUPORSHUTUP2025';
      case 'cashapp': return '$PUOSUCASH';
      case 'paypal': return 'paypal.me/puosu';
      default: return '';
    }
  };

  if (showInstructions) {
    return (
      <Card className="bg-black text-white max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-green-400 text-center">Complete Your Deposit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg">Send <strong className="text-green-400">${amount}</strong> to:</p>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-xl font-bold text-orange-500 mb-2">
              {paymentMethod === 'venmo' && '💸 Venmo: @PUTUPORSHUTUP2025'}
              {paymentMethod === 'cashapp' && '💸 Cash App: $PUOSUCASH'} 
              {paymentMethod === 'paypal' && '💸 PayPal: paypal.me/puosu'}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg text-left space-y-2">
            <p><strong>Important:</strong></p>
            <p>• Include your username/email in the payment notes</p>
            <p>• Amount: ${amount}</p>
            <p>• Your deposit will be processed within 24 hours</p>
          </div>

          <Button 
            onClick={() => {
              setShowInstructions(false);
              setAmount('');
              setPaymentMethod('');
            }}
            variant="outline"
            className="w-full"
          >
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black text-white max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl text-orange-500 text-center">Add Funds to Wallet</CardTitle>
        <p className="text-gray-300 text-center">Deposit money to participate in challenges and tournaments</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="amount" className="text-white">Deposit Amount</Label>
          <Input
            id="amount"
            type="number"
            min="5"
            step="0.01"
            placeholder="Enter amount (minimum $5)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label className="text-white mb-3 block">Select Payment Method</Label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'venmo', name: 'Venmo', handle: '@PUTUPORSHUTUP2025', icon: '💸' },
              { id: 'cashapp', name: 'Cash App', handle: '$PUOSUCASH', icon: '💸' },
              { id: 'paypal', name: 'PayPal', handle: 'paypal.me/puosu', icon: '💸' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === method.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold">{method.icon} {method.name}</div>
                  <div className="text-sm text-gray-400">{method.handle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleDepositRequest}
          disabled={loading || !amount || !paymentMethod}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3"
        >
          {loading ? "Processing..." : "Submit Deposit Request"}
        </Button>

        <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300">
          <p><strong>How it works:</strong></p>
          <p>1. Enter the amount you want to deposit</p>
          <p>2. Choose your preferred payment method</p>
          <p>3. Complete the payment and include your account info</p>
          <p>4. Funds will be added to your wallet within 24 hours</p>
        </div>
      </CardContent>
    </Card>
  );
};