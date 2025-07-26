import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PayoneerPayoutModalProps {
  balance: number;
  payoneerEmail?: string;
  onPayoutRequested: () => void;
}

export const PayoneerPayoutModal = ({ balance, payoneerEmail, onPayoutRequested }: PayoneerPayoutModalProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(payoneerEmail || '');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) return;
    
    const payoutAmount = parseFloat(amount);
    if (!email || !payoutAmount || payoutAmount <= 0) {
      toast({
        title: "Invalid Request",
        description: "Please provide a valid Payoneer email and amount.",
        variant: "destructive"
      });
      return;
    }

    if (payoutAmount > balance) {
      toast({
        title: "Insufficient Funds",
        description: "Payout amount exceeds your current balance.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Update profile with Payoneer email if it's different
      if (email !== payoneerEmail) {
        await supabase
          .from('profiles')
          .update({ payoneer_email: email })
          .eq('user_id', user.id);
      }

      // Create payout request
      const { error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: user.id,
          payoneer_email: email,
          amount: payoutAmount
        });

      if (error) throw error;

      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted. Funds will be sent to your Payoneer account within 24 hours.",
      });

      setOpen(false);
      setAmount('');
      onPayoutRequested();
      
    } catch (error) {
      console.error('Payout request error:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit payout request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          💸 Request Payout via Payoneer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💸 Request Payout via Payoneer
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Funds will be sent to your Payoneer account within 24 hours.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="payoneer-email">Payoneer Email</Label>
            <Input
              id="payoneer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-amount">Payout Amount</Label>
            <Input
              id="payout-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              max={balance}
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              Available balance: ${balance.toFixed(2)}
            </p>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing || !email || !amount}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Confirm Payout Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};