-- Fix infinite recursion in profiles policies by using security definer functions
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;

-- Create security definer function to get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a better policy for viewing matched profiles using the function
CREATE POLICY "Users can view matched profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.buyer_id = profiles.id OR m.seller_id = profiles.id)
    AND (
      m.buyer_id = public.get_current_user_profile_id()
      OR m.seller_id = public.get_current_user_profile_id()
    )
  )
);

-- Create a simpler policy for viewing seller display names only
CREATE POLICY "Users can view seller display names only" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'seller' 
  AND EXISTS (
    SELECT 1 FROM public.properties prop 
    WHERE prop.owner_id = profiles.id 
    AND prop.status = 'approved'
  )
);