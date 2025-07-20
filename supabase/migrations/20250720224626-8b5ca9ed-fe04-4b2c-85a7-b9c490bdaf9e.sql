-- Create subscription management table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan_id TEXT NOT NULL DEFAULT 'premium_monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true);

-- Add premium status to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN premium_expires_at TIMESTAMPTZ;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION public.update_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile premium status based on subscription
  UPDATE public.profiles 
  SET 
    is_premium = (NEW.status = 'active'),
    premium_expires_at = CASE 
      WHEN NEW.status = 'active' THEN NEW.current_period_end
      ELSE NULL 
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update premium status
CREATE TRIGGER update_premium_status_trigger
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_premium_status();