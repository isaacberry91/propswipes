-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Let's also check and fix the RLS policy
-- Drop and recreate the RLS policy to ensure it works correctly
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

CREATE POLICY "Match participants can send messages" 
ON messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Check if user is a participant in the match
  EXISTS (
    SELECT 1 
    FROM matches m
    JOIN profiles sender_profile ON sender_profile.id = messages.sender_id
    JOIN profiles buyer_profile ON buyer_profile.id = m.buyer_id
    JOIN profiles seller_profile ON seller_profile.id = m.seller_id
    WHERE m.id = messages.match_id 
      AND sender_profile.user_id = auth.uid()
      AND sender_profile.deleted_at IS NULL
      AND (
        (buyer_profile.user_id = auth.uid() AND buyer_profile.deleted_at IS NULL) OR
        (seller_profile.user_id = auth.uid() AND seller_profile.deleted_at IS NULL)
      )
  )
);