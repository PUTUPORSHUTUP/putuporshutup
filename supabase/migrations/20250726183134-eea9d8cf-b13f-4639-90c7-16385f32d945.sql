-- Create escrow accounts table to track funds held in escrow
CREATE TABLE public.escrow_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
  held_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  released_to UUID,
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow transactions table for tracking all escrow movements
CREATE TABLE public.escrow_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_account_id UUID NOT NULL REFERENCES public.escrow_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('hold', 'release', 'refund', 'dispute_raised', 'dispute_resolved')),
  amount NUMERIC NOT NULL,
  processed_by UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for escrow_accounts
CREATE POLICY "Users can view their own escrow accounts" 
ON public.escrow_accounts 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = released_to OR 
       wager_id IN (SELECT id FROM wagers WHERE creator_id = auth.uid()));

CREATE POLICY "Service can manage all escrow accounts" 
ON public.escrow_accounts 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all escrow accounts" 
ON public.escrow_accounts 
FOR ALL 
USING (is_user_admin());

-- RLS policies for escrow_transactions
CREATE POLICY "Users can view their related escrow transactions" 
ON public.escrow_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM escrow_accounts 
  WHERE id = escrow_account_id 
  AND (user_id = auth.uid() OR released_to = auth.uid() OR 
       wager_id IN (SELECT id FROM wagers WHERE creator_id = auth.uid()))
));

CREATE POLICY "Service can manage all escrow transactions" 
ON public.escrow_transactions 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all escrow transactions" 
ON public.escrow_transactions 
FOR ALL 
USING (is_user_admin());

-- Add updated_at trigger for escrow_accounts
CREATE TRIGGER update_escrow_accounts_updated_at
BEFORE UPDATE ON public.escrow_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_escrow_accounts_wager_id ON public.escrow_accounts(wager_id);
CREATE INDEX idx_escrow_accounts_user_id ON public.escrow_accounts(user_id);
CREATE INDEX idx_escrow_accounts_status ON public.escrow_accounts(status);
CREATE INDEX idx_escrow_transactions_escrow_account_id ON public.escrow_transactions(escrow_account_id);