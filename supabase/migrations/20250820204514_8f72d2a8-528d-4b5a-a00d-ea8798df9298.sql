-- Drop the problematic policy that might be interfering
DROP POLICY IF EXISTS "Users can view profiles of matched users in chat" ON public.profiles;

-- The existing policy should be sufficient for matches functionality