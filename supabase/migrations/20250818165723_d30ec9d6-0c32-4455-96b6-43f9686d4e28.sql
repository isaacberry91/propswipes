-- Update RLS policy to allow users to see their own deleted properties
DROP POLICY "Users can view their own properties including deleted" ON public.properties;

CREATE POLICY "Users can view their own properties including deleted" 
ON public.properties 
FOR SELECT 
USING (owner_id = get_user_profile_id_for_auth_user());