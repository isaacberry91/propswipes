-- Drop the existing RLS policy that expects auth user ID
DROP POLICY IF EXISTS "Users can create their own swipes" ON property_swipes;

-- Create new RLS policy that works with profile IDs
CREATE POLICY "Users can create their own swipes" 
ON property_swipes 
FOR INSERT 
WITH CHECK (user_id = get_user_profile_id_for_auth_user());

-- Also update the SELECT policy to work with profile IDs
DROP POLICY IF EXISTS "Users can view their own swipes" ON property_swipes;

CREATE POLICY "Users can view their own swipes" 
ON property_swipes 
FOR SELECT 
USING (user_id = get_user_profile_id_for_auth_user());