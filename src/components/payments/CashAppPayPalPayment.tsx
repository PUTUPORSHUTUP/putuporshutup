import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Smartphone, 
  QrCode,
  Info,
  Clock,
  ArrowDownLeft,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface CashAppPayPalPaymentProps {
  onDepositComplete: () => void;
}

export const CashAppPayPalPayment = ({ onDepositComplete }: CashAppPayPalPaymentProps) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cashapp' | 'paypal'>('cashapp');
  const [processing, setProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Temporary payment info until Tilled provides merchant account
  const paymentInfo = {
    cashapp: {
      handle: '$BigKeith00',
      qrCode: '/lovable-uploads/1930f879-1b39-46b0-979f-fd849f770134.png',
      name: 'Keith White'
    },
    paypal: {
      handle: 'KEITH WHITE',
      qrCode: '/lovable-uploads/aea2fe21-2dfc-4892-a6b7-c51889f74b09.png',
      name: 'Keith White'
    }
  };

  const handleSubmitPaymentRequest = async () => {
    if (!user || !depositAmount) return;
    
    const amount = parseFloat(depositAmount);
    if (amount < 5) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $5.00",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Create manual payment request
      const { error } = await supabase
        .from('manual_payment_requests')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'deposit',
          payment_method: paymentMethod.toUpperCase(),
          account_details: paymentInfo[paymentMethod].handle,
          user_notes: `${paymentMethod.toUpperCase()} deposit request for $${amount}`
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit payment request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Payment Request Submitted!",
        description: `Your $${amount} deposit request has been submitted. You'll be notified once processed.`,
      });

      setDepositAmount('');
      setShowInstructions(true);
    } catch (error) {
      console.error('Payment request error:', error);
      toast({
        title: "Error",
        description: "Unable to submit payment request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong>Fast Payment Processing:</strong> Cash App and PayPal deposits are processed by our admin team. 
          ⚡ Most deposits are approved within 1 hour during business hours!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Cash App & PayPal Deposits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'cashapp' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cashapp')}
                className="h-12"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Cash App
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('paypal')}
                className="h-12"
              >
                <span className="font-bold text-blue-600 mr-2">P</span>
                PayPal
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deposit Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="5"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="25.00"
                className="flex-1"
              />
              <Button 
                onClick={handleSubmitPaymentRequest}
                disabled={processing || !depositAmount}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Request Deposit
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum $5.00 • ⚡ Fast-tracked by admin (usually under 1 hour)
            </p>
          </div>

          {/* Payment Instructions */}
          {showInstructions && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Send Payment to Complete Deposit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Cash App QR */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-3">
                      <img 
                        src={paymentInfo.cashapp.qrCode} 
                        alt="Cash App QR Code"
                        className="w-24 h-24 mx-auto"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{paymentInfo.cashapp.name}</p>
                      <Badge variant="outline" className="text-sm px-2 py-1">
                        {paymentInfo.cashapp.handle}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Cash App</p>
                    </div>
                  </div>

                  {/* PayPal QR */}
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-3">
                      <img 
                        src={paymentInfo.paypal.qrCode} 
                        alt="PayPal QR Code"
                        className="w-24 h-24 mx-auto"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{paymentInfo.paypal.name}</p>
                      <Badge variant="outline" className="text-sm px-2 py-1">
                        {paymentInfo.paypal.handle}
                      </Badge>
                      <p className="text-xs text-muted-foreground">PayPal</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Next Steps:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Send exactly ${depositAmount} to the {paymentMethod} above</li>
                      <li>Include your username in the payment note</li>
                      <li>⚡ Your deposit will be processed within 1 hour (business hours)</li>
                      <li>You'll receive a notification when funds are added</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowInstructions(false)}
                  >
                    Submit Another Request
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/profile', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};