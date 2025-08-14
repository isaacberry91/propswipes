-- Remove all problematic policies and function that cause infinite recursion
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view seller display names only" ON public.profiles;
DROP FUNCTION IF EXISTS public.get_current_user_profile_id();

-- Create much simpler policies that don't cause recursion
-- For now, only keep the essential policies for profile management

-- This policy is fine - it doesn't cause recursion
-- Users can view their own profile (already exists)

-- For viewing other profiles, let's create a very simple policy
-- Users can view basic info of seller profiles when they have approved properties
CREATE POLICY "Public can view seller profiles with approved properties" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'seller' 
  AND EXISTS (
    SELECT 1 FROM public.properties 
    WHERE owner_id = profiles.id 
    AND status = 'approved'
  )
);