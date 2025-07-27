-- Fix security definer functions to have search_path set
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID, tier subscription_tier)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID)
RETURNS subscription_tier
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
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