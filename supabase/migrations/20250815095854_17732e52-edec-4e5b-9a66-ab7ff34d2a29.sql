-- Drop and recreate the messages insert policy with a simplified approach
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

-- Create a much simpler insert policy for messages
CREATE POLICY "Match participants can send messages" 
ON messages 
FOR INSERT 
WITH CHECK (
  -- Check if the sender is a participant in the match
  sender_id IN (
    SELECT UNNEST(ARRAY[m.buyer_id, m.seller_id])
    FROM matches m
    WHERE m.id = match_id
  )
  AND
  -- Check if the sender belongs to the current authenticated user
  sender_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);