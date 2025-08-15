-- Fix the RLS policy for sending messages
-- The current policy has redundant conditions that may be causing issues

DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

CREATE POLICY "Match participants can send messages" 
ON messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Check if the sender is the authenticated user and is a participant in the match
  EXISTS (
    SELECT 1 
    FROM matches m
    JOIN profiles sender_profile ON sender_profile.id = messages.sender_id
    WHERE m.id = messages.match_id 
      AND sender_profile.user_id = auth.uid()
      AND sender_profile.deleted_at IS NULL
      AND (
        m.buyer_id = messages.sender_id OR 
        m.seller_id = messages.sender_id
      )
  )
);