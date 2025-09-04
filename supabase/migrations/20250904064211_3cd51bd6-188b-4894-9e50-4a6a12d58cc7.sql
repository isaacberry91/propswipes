-- Allow authenticated users (buyers) to create matches securely
-- Ensures: (1) the buyer is the current user, (2) the seller owns the property, (3) buyer and seller are different
DROP POLICY IF EXISTS "Users can create matches as buyer" ON public.matches;
CREATE POLICY "Users can create matches as buyer"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (
  -- The buyer must be the current authenticated user
  auth.uid() = (
    SELECT p.user_id FROM public.profiles p WHERE p.id = matches.buyer_id
  )
  AND
  -- The seller must own the property
  EXISTS (
    SELECT 1 FROM public.properties pr
    WHERE pr.id = matches.property_id
      AND pr.owner_id = matches.seller_id
  )
  AND
  -- Cannot match with yourself
  matches.buyer_id <> matches.seller_id
);
