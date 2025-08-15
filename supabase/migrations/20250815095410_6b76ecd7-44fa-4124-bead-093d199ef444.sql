-- Drop and recreate the messages insert policy with direct auth.uid() check
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

-- Create insert policy for messages with direct auth.uid() check
CREATE POLICY "Match participants can send messages" 
ON messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM matches m
    INNER JOIN profiles sender_profile ON sender_profile.id = messages.sender_id
    WHERE m.id = messages.match_id 
      AND sender_profile.user_id = auth.uid()
      AND sender_profile.deleted_at IS NULL
      AND (m.buyer_id = messages.sender_id OR m.seller_id = messages.sender_id)
  )
);