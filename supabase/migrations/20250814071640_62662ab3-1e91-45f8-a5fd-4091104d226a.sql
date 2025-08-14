-- Update RLS policies to exclude deleted profiles

-- Update the existing profile view policies to exclude deleted profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view seller profiles with approved properties" ON public.profiles;

-- Recreate policies with deleted_at filter
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Public can view seller profiles with approved properties" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'seller'::user_type 
  AND deleted_at IS NULL 
  AND EXISTS (
    SELECT 1 
    FROM properties 
    WHERE properties.owner_id = profiles.id 
    AND properties.status = 'approved'::property_status
  )
);

-- Also update property-related policies to exclude properties from deleted users
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (
  owner_id = get_user_profile_id_for_auth_user() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = properties.owner_id 
    AND profiles.deleted_at IS NULL
  )
);

-- Update property creation policy to prevent deleted users from creating properties
DROP POLICY IF EXISTS "Users can create properties" ON public.properties;
CREATE POLICY "Users can create properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (
  owner_id = get_user_profile_id_for_auth_user()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = get_user_profile_id_for_auth_user() 
    AND profiles.deleted_at IS NULL
  )
);

-- Update property update policy
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
CREATE POLICY "Users can update their own properties" 
ON public.properties 
FOR UPDATE 
USING (
  owner_id = get_user_profile_id_for_auth_user()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = properties.owner_id 
    AND profiles.deleted_at IS NULL
  )
);

-- Update matches policies to exclude deleted users
DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
CREATE POLICY "Users can view their matches" 
ON public.matches 
FOR SELECT 
USING (
  (
    auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = matches.buyer_id)
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = matches.buyer_id AND profiles.deleted_at IS NULL)
  ) OR (
    auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = matches.seller_id)
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = matches.seller_id AND profiles.deleted_at IS NULL)
  )
);

-- Update messages policies to exclude deleted users
DROP POLICY IF EXISTS "Match participants can view messages" ON public.messages;
CREATE POLICY "Match participants can view messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM matches m
    JOIN profiles p1 ON m.buyer_id = p1.id
    JOIN profiles p2 ON m.seller_id = p2.id
    WHERE m.id = messages.match_id 
    AND ((p1.user_id = auth.uid() AND p1.deleted_at IS NULL) OR (p2.user_id = auth.uid() AND p2.deleted_at IS NULL))
  )
);

DROP POLICY IF EXISTS "Match participants can send messages" ON public.messages;
CREATE POLICY "Match participants can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM matches m
    JOIN profiles p1 ON m.buyer_id = p1.id
    JOIN profiles p2 ON m.seller_id = p2.id
    WHERE m.id = messages.match_id 
    AND ((p1.user_id = auth.uid() AND p1.deleted_at IS NULL) OR (p2.user_id = auth.uid() AND p2.deleted_at IS NULL))
  ) 
  AND auth.uid() = (
    SELECT profiles.user_id 
    FROM profiles 
    WHERE profiles.id = messages.sender_id 
    AND profiles.deleted_at IS NULL
  )
);