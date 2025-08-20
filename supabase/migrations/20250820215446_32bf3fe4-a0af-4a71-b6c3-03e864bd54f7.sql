-- Remove the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles of matched users" ON public.profiles;