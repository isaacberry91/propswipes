-- Create a security definer function to get profile data for matched users
-- This bypasses RLS issues by running with elevated privileges
CREATE OR REPLACE FUNCTION public.get_matched_user_profile(target_profile_id uuid, requesting_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  user_type user_type,
  bio text,
  phone text,
  location text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return profile if users have a match together
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.user_type,
    p.bio,
    p.phone,
    p.location
  FROM profiles p
  WHERE p.id = target_profile_id
    AND p.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM matches m
      JOIN profiles requesting_profile ON requesting_profile.user_id = requesting_user_id
      WHERE (
        (m.buyer_id = target_profile_id AND m.seller_id = requesting_profile.id) OR
        (m.seller_id = target_profile_id AND m.buyer_id = requesting_profile.id)
      )
    );
$$;