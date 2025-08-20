-- Allow users to view profiles of people they have matches with
CREATE POLICY "Users can view profiles of matched users" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.matches m
    WHERE (
      (m.buyer_id = id AND m.seller_id = get_user_profile_id_for_auth_user()) OR
      (m.seller_id = id AND m.buyer_id = get_user_profile_id_for_auth_user())
    )
  )
);