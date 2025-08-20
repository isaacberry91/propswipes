-- Create a policy to allow users to view profiles of people they are matched with
-- This will enable the profile joins in the matches query to work properly

CREATE POLICY "Users can view profiles of matched users in chat" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT CASE 
      WHEN matches.buyer_id = get_user_profile_id_for_auth_user() THEN matches.seller_id
      WHEN matches.seller_id = get_user_profile_id_for_auth_user() THEN matches.buyer_id
    END
    FROM matches 
    WHERE (matches.buyer_id = get_user_profile_id_for_auth_user() OR matches.seller_id = get_user_profile_id_for_auth_user())
    AND CASE 
      WHEN matches.buyer_id = get_user_profile_id_for_auth_user() THEN matches.seller_id
      WHEN matches.seller_id = get_user_profile_id_for_auth_user() THEN matches.buyer_id
    END IS NOT NULL
  )
);