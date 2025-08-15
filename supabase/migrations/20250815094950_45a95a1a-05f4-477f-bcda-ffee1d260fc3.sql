-- Drop and recreate the messages insert policy using the helper function
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

-- Create insert policy for messages using the helper function
CREATE POLICY "Match participants can send messages" 
ON messages 
FOR INSERT 
WITH CHECK (
  sender_id = get_user_profile_id_for_auth_user()
  AND
  EXISTS (
    SELECT 1 
    FROM matches m
    WHERE m.id = match_id 
      AND (m.buyer_id = sender_id OR m.seller_id = sender_id)
  )
);