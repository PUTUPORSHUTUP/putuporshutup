-- Add payoneer_email field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN payoneer_email TEXT;

-- Create payout_requests table
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payoneer_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for payout_requests
CREATE POLICY "Users can create their own payout requests" 
ON public.payout_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payout requests" 
ON public.payout_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payout requests" 
ON public.payout_requests 
FOR ALL 
USING (is_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payout_requests_updated_at
BEFORE UPDATE ON public.payout_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();