-- Allow users to update their own swipes (for changing likes/dislikes)
CREATE POLICY "Users can update their own swipes"
ON public.property_swipes
FOR UPDATE
USING (user_id = get_user_profile_id_for_auth_user())
WITH CHECK (user_id = get_user_profile_id_for_auth_user());