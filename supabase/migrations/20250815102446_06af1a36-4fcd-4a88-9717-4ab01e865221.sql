-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages for their own matches
CREATE POLICY "Users can view messages for their matches" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (
      matches.buyer_id = get_user_profile_id_for_auth_user() 
      OR matches.seller_id = get_user_profile_id_for_auth_user()
    )
  )
);

-- Allow users to create messages for their own matches
CREATE POLICY "Users can create messages for their matches" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  sender_id = get_user_profile_id_for_auth_user()
  AND EXISTS (
    SELECT 1 FROM public.matches 
    WHERE matches.id = messages.match_id 
    AND (
      matches.buyer_id = get_user_profile_id_for_auth_user() 
      OR matches.seller_id = get_user_profile_id_for_auth_user()
    )
  )
);

-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email') = ANY(ARRAY[
    'admin@propswipes.com', 
    'support@propswipes.com', 
    'isaacberry91@yahoo.com', 
    'ankur@furrisic.com', 
    'developer@furrisic.com'
  ])
);