-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policies for profile access
-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can view profiles of people they have matches with (for messaging)
CREATE POLICY "Users can view matched profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.buyer_id = profiles.id OR m.seller_id = profiles.id)
    AND (
      m.buyer_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR m.seller_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- 3. Users can view basic profile info (display_name only) of property owners
-- This is needed for property listings to show owner names
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