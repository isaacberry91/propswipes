-- Remove the policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view profiles of matched users" ON public.profiles;

-- The app should work with the existing policies:
-- - "Users can view their own profile" 
-- - "Public can view seller profiles with approved properties"
-- - "Admins can view all profiles"