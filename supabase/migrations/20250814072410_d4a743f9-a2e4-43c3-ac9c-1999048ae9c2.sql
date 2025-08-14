-- Fix infinite recursion in RLS policies

-- Fix property_swipes policies (incorrect self-reference)
DROP POLICY IF EXISTS "Users can view their own swipes" ON property_swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON property_swipes;

CREATE POLICY "Users can view their own swipes" 
ON property_swipes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swipes" 
ON property_swipes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix properties policies to avoid circular reference with profiles
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;

CREATE POLICY "Users can view their own properties" 
ON properties 
FOR SELECT 
USING (owner_id = get_user_profile_id_for_auth_user());

CREATE POLICY "Users can update their own properties" 
ON properties 
FOR UPDATE 
USING (owner_id = get_user_profile_id_for_auth_user());

CREATE POLICY "Users can create properties" 
ON properties 
FOR INSERT 
WITH CHECK (owner_id = get_user_profile_id_for_auth_user());

-- Fix profiles policy to avoid circular reference with properties
DROP POLICY IF EXISTS "Public can view seller profiles with approved properties" ON profiles;

CREATE POLICY "Public can view seller profiles with approved properties" 
ON profiles 
FOR SELECT 
USING (user_type = 'seller'::user_type AND deleted_at IS NULL);