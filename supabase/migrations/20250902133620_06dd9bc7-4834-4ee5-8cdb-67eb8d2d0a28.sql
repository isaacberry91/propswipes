-- Allow users to delete their own notifications so "Clear all" actually removes them
-- RLS is already enabled; we add a DELETE policy scoped to the recipient
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (recipient_id = get_user_profile_id_for_auth_user());