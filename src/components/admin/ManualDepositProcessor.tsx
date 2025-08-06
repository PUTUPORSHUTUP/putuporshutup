import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  User, 
  CreditCard,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

interface DepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  user_notes: string;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    wallet_balance: number;
  } | null;
}

export const ManualDepositProcessor = () => {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .select(`
          id,
          user_id,
          amount,
          payment_method,
          account_details,
          user_notes,
          status,
          created_at,
          profiles:user_id (
            username,
            display_name,
            wallet_balance
          )
        `)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match our interface
      const transformedData: DepositRequest[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.amount,
        payment_method: item.payment_method,
        account_details: item.account_details,
        user_notes: item.user_notes,
        status: item.status,
        created_at: item.created_at,
        profiles: item.profiles
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching deposit requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deposit requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const processDeposit = async (request: DepositRequest) => {
    if (processing) return;

    setProcessing(request.id);
    try {
      // Update user wallet balance
      const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
        user_id_param: request.user_id,
        amount_param: request.amount
      });

      if (walletError) throw walletError;

      // Update request status
      const { error: updateError } = await supabase
        .from('manual_payment_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes[request.id] || 'Deposit processed successfully'
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast({
        title: "Deposit Processed",
        description: `$${request.amount} credited to ${request.profiles?.username}'s wallet`,
      });

      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectDeposit = async (request: DepositRequest) => {
    if (processing) return;

    setProcessing(request.id);
    try {
      const { error } = await supabase
        .from('manual_payment_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes[request.id] || 'Deposit rejected'
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Deposit Rejected",
        description: `Deposit request from ${request.profiles?.username} has been rejected`,
        variant: "destructive",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: "Error",
        description: "Failed to reject deposit",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(request =>
    request.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const totalPendingAmount = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading deposit requests...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">${totalPendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or payment method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={fetchRequests} 
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Deposit Requests */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deposit Requests</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No requests match your search criteria.' : 'All deposit requests have been processed.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {request.profiles?.display_name || request.profiles?.username}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        @{request.profiles?.username}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-lg">${request.amount}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="capitalize">{request.payment_method}</span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Details:</p>
                      <p className="text-sm">{request.account_details}</p>
                    </div>

                    {request.user_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">User Notes:</p>
                        <p className="text-sm bg-muted p-2 rounded">{request.user_notes}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current Wallet: ${request.profiles?.wallet_balance || 0}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Admin Notes</label>
                        <Textarea
                          placeholder="Add notes about this deposit..."
                          value={adminNotes[request.id] || ''}
                          onChange={(e) => setAdminNotes(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          className="h-20"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => processDeposit(request)}
                          disabled={processing === request.id}
                          className="flex-1"
                        >
                          {processing === request.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Process Deposit
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => rejectDeposit(request)}
                          disabled={processing === request.id}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};