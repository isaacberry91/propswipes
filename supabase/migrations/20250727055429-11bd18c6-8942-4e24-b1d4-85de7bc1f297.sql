-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- Create subscription tier enum  
CREATE TYPE subscription_tier AS ENUM ('buyer_pro', 'seller_basic', 'seller_professional', 'seller_enterprise');

-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_tier subscription_tier NOT NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  apple_transaction_id TEXT UNIQUE,
  apple_receipt_data TEXT,
  subscription_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_end TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, subscription_tier)
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can manage subscriptions" 
ON public.subscribers 
FOR ALL 
USING (true);

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID, tier subscription_tier)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscribers
    WHERE user_id = user_uuid
      AND subscription_tier = tier
      AND status = 'active'
      AND subscription_end > now()
  );
$$;

-- Create function to get user's highest subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID)
RETURNS subscription_tier
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT subscription_tier
  FROM public.subscribers
  WHERE user_id = user_uuid
    AND status = 'active'
    AND subscription_end > now()
  ORDER BY 
    CASE subscription_tier
      WHEN 'seller_enterprise' THEN 4
      WHEN 'seller_professional' THEN 3
      WHEN 'seller_basic' THEN 2
      WHEN 'buyer_pro' THEN 1
    END DESC
  LIMIT 1;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN daily_likes_used INTEGER DEFAULT 0,
ADD COLUMN daily_likes_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN properties_listed INTEGER DEFAULT 0;