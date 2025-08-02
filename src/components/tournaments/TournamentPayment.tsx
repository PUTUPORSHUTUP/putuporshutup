import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeGenerator, generatePaymentURL } from '@/components/payments/QRCodeGenerator';
import { 
  QrCode,
  DollarSign,
  Clock,
  CheckCircle,
  Info,
  Smartphone
} from 'lucide-react';

interface TournamentPaymentProps {
  tournament: any;
  onPaymentComplete: () => void;
  vendorInfo?: {
    cashapp: string;
    paypal: string;
    venmo?: string;
  };
}

export const TournamentPayment = ({ 
  tournament, 
  onPaymentComplete,
  vendorInfo = {
    cashapp: '$BigKeith00',
    paypal: 'KEITH-WHITE',
    venmo: 'Keith-White'
  }
}: TournamentPaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'cashapp' | 'paypal' | 'venmo'>('cashapp');
  const [processing, setProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmitPaymentRequest = async () => {
    if (!user || !tournament) return;
    
    setProcessing(true);
    try {
      // Create manual payment request for tournament entry
      const { error } = await supabase
        .from('manual_payment_requests')
        .insert({
          user_id: user.id,
          amount: tournament.entry_fee,
          type: 'tournament_entry',
          payment_method: paymentMethod.toUpperCase(),
          account_details: vendorInfo[paymentMethod],
          user_notes: `Tournament entry: ${tournament.title} (ID: ${tournament.id})`
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
        description: `Your $${tournament.entry_fee} tournament entry payment has been submitted for verification.`,
      });

      setShowInstructions(true);
    } catch (error) {
      console.error('Tournament payment request error:', error);
      toast({
        title: "Error",
        description: "Unable to submit payment request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const paymentUrl = generatePaymentURL(
    paymentMethod,
    vendorInfo[paymentMethod],
    tournament.entry_fee,
    `Tournament-${tournament.id}`
  );

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <Smartphone className="w-5 h-5" />
          Tournament Entry Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Tournament:</strong> {tournament.title}<br />
            <strong>Entry Fee:</strong> ${tournament.entry_fee}<br />
            <strong>Prize Pool:</strong> ${tournament.prize_pool}
          </AlertDescription>
        </Alert>

        {!showInstructions ? (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h4 className="font-medium">Select Payment Method</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'cashapp' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cashapp')}
                  className="h-12"
                  size="sm"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Cash App
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('paypal')}
                  className="h-12"
                  size="sm"
                >
                  <span className="font-bold text-blue-600 mr-1">P</span>
                  PayPal
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'venmo' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('venmo')}
                  className="h-12"
                  size="sm"
                >
                  <span className="font-bold text-purple-600 mr-1">V</span>
                  Venmo
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSubmitPaymentRequest}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {processing ? "Processing..." : `Pay $${tournament.entry_fee} Entry Fee`}
            </Button>
          </>
        ) : (
          <>
            {/* QR Code Payment Instructions */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-300">
                  Scan QR Code to Pay
                </h4>
              </div>
              
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeGenerator 
                  value={paymentUrl}
                  size={200}
                  className="mx-auto"
                />
              </div>
              
              <div className="space-y-2">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {vendorInfo[paymentMethod]}
                </Badge>
                <p className="text-sm text-muted-foreground capitalize">
                  {paymentMethod} • ${tournament.entry_fee}
                </p>
              </div>
            </div>

            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                <strong>Payment Instructions:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Scan the QR code above with your {paymentMethod} app</li>
                  <li>Send exactly ${tournament.entry_fee}</li>
                  <li>Include note: "Tournament-{tournament.id}"</li>
                  <li>✅ Admin will verify payment within 1 hour</li>
                  <li>🎮 You'll be automatically added to the tournament</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowInstructions(false)}
                className="flex-1"
              >
                Change Payment Method
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onPaymentComplete}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I've Sent Payment
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};