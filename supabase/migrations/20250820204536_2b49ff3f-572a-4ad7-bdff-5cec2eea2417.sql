-- Restore the correct policy for viewing profiles of matched users
-- This allows users to see profiles of people they are matched with for chat functionality

CREATE POLICY "Users can view profiles of matched users" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT
      CASE
        WHEN (matches.buyer_id = get_user_profile_id_for_auth_user()) THEN matches.seller_id
        WHEN (matches.seller_id = get_user_profile_id_for_auth_user()) THEN matches.buyer_id
        ELSE NULL::uuid
      END AS "case"
    FROM matches
    WHERE ((matches.buyer_id = get_user_profile_id_for_auth_user()) OR (matches.seller_id = get_user_profile_id_for_auth_user()))
  )
);