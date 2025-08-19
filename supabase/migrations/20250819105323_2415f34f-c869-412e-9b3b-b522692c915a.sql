-- Create function to get profile data with email from auth.users
CREATE OR REPLACE FUNCTION public.get_profile_with_email(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  user_type user_type,
  bio text,
  phone text,
  location text,
  email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.user_type,
    p.bio,
    p.phone,
    p.location,
    au.email
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = profile_user_id
  AND p.deleted_at IS NULL;
$$;