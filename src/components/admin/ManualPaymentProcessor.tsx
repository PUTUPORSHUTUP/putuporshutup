import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Search, DollarSign, Users } from 'lucide-react';

interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  payment_method: string;
  status: string;
  subscription_tier?: string;
  user_notes: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
  } | null;
}

export const ManualPaymentProcessor = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'approve') {
        // Update user balance for deposits using secure RPC
        if (request.type === 'deposit') {
          const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
            user_id_param: request.user_id,
            amount_param: request.amount
          });

          if (walletError) throw walletError;

          // Record transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: request.user_id,
              type: 'deposit',
              amount: request.amount,
              status: 'completed',
              description: `Manual deposit via ${request.payment_method}`
            });
        }

        // Handle subscription payments
        if (request.type === 'subscription' && request.subscription_tier) {
          // Create subscription record
          await supabase
            .from('subscriptions')
            .insert({
              user_id: request.user_id,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

          // Update profile premium status
          await supabase
            .from('profiles')
            .update({ 
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('user_id', request.user_id);
        }
      }

      // Update request status
      const { error } = await supabase
        .from('manual_payment_requests')
        .update({ 
          status: action === 'approve' ? 'completed' : 'rejected',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Payment ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Successfully ${action}d payment request`,
      });

      fetchPaymentRequests();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const filteredRequests = requests.filter(request =>
    request.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const totalPendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${totalPendingAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Request Management</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by username, type, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p>Loading payment requests...</p>
            ) : filteredRequests.length === 0 ? (
              <p className="text-muted-foreground">No payment requests found</p>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={request.status === 'pending' ? 'default' : 
                                        request.status === 'completed' ? 'secondary' : 'destructive'}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline">{request.type}</Badge>
                          {request.subscription_tier && (
                            <Badge variant="outline">{request.subscription_tier}</Badge>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {request.profiles?.display_name || request.profiles?.username || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${request.amount} via {request.payment_method}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                          {request.user_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {request.user_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => processPayment(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => processPayment(request.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};