-- Fix infinite recursion in properties policies
-- Drop the problematic policies that query profiles table
DROP POLICY IF EXISTS "Users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;

-- Create a security definer function that safely gets user profile ID without recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_id_for_auth_user()
RETURNS UUID 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Recreate the policies using the security definer function
CREATE POLICY "Users can create properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (owner_id = public.get_user_profile_id_for_auth_user());

CREATE POLICY "Users can update their own properties" 
ON public.properties 
FOR UPDATE 
USING (owner_id = public.get_user_profile_id_for_auth_user());

CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (owner_id = public.get_user_profile_id_for_auth_user());