import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  User,
  CreditCard
} from 'lucide-react';

interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  payment_method: string;
  account_details: string;
  user_notes: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

export const FastPaymentProcessor = () => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading payments:', error);
        toast({
          title: "Error",
          description: "Failed to load payment requests",
          variant: "destructive"
        });
        return;
      }

      // Get user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);

        // Merge profiles with payments
        const paymentsWithProfiles = data.map(payment => ({
          ...payment,
          profiles: profilesData?.find(p => p.user_id === payment.user_id) || null
        }));
        
        setPayments(paymentsWithProfiles);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPayments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const processPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setProcessing(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke('process-manual-payment', {
        body: {
          payment_id: paymentId,
          action: action,
          admin_notes: adminNotes[paymentId] || null
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: `Payment ${action}d!`,
        description: `Payment request has been ${action}d successfully.`,
        variant: action === 'approve' ? 'default' : 'destructive'
      });

      // Remove processed payment from list
      setPayments(payments.filter(p => p.id !== paymentId));
      
      // Clear admin notes for this payment
      const newNotes = { ...adminNotes };
      delete newNotes[paymentId];
      setAdminNotes(newNotes);

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const updateAdminNotes = (paymentId: string, notes: string) => {
    setAdminNotes(prev => ({
      ...prev,
      [paymentId]: notes
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">⚡ Fast Payment Processor</h2>
          <p className="text-muted-foreground">Process Cash App & PayPal deposits instantly</p>
        </div>
        <Button
          onClick={loadPendingPayments}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending payment requests to process.</p>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5" />
                    {payment.payment_method} Deposit
                  </CardTitle>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {payment.profiles?.display_name || payment.profiles?.username || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-medium">{payment.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {new Date(payment.created_at).toLocaleTimeString()} 
                    </p>
                  </div>
                </div>

                {payment.account_details && (
                  <div>
                    <p className="text-sm text-muted-foreground">Account Details</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {payment.account_details}
                    </p>
                  </div>
                )}

                {payment.user_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">User Notes</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {payment.user_notes}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes (Optional)</p>
                  <Textarea
                    value={adminNotes[payment.id] || ''}
                    onChange={(e) => updateAdminNotes(payment.id, e.target.value)}
                    placeholder="Add notes about this payment verification..."
                    className="h-20"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => processPayment(payment.id, 'approve')}
                    disabled={processing === payment.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === payment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve & Add Funds
                  </Button>
                  <Button
                    onClick={() => processPayment(payment.id, 'reject')}
                    disabled={processing === payment.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === payment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};