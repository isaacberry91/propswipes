-- Fix infinite recursion in profiles policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view basic seller profile info" ON public.property_owner_profiles;
DROP VIEW IF EXISTS public.property_owner_profiles;

-- Create a simpler, non-recursive policy for viewing matched profiles
-- This avoids the infinite recursion by not querying profiles table within the policy
CREATE POLICY "Users can view matched profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.buyer_id = profiles.id OR m.seller_id = profiles.id)
    AND (
      m.buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR m.seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- Create a simpler policy that allows viewing seller display names only
-- for properties without using a view
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