-- First, let's update the handle_new_user function to better handle Apple and other OAuth providers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Extract display name from various possible metadata sources
  -- Apple, Google, and other providers store names differently
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    phone, 
    location,
    user_type
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.email, '@', 1) -- Fallback to email username
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'location',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer')::user_type
  );
  RETURN NEW;
END;
$$;

-- Create the trigger that was missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing profiles that have null display names
-- This will help with users who signed up before the trigger was fixed
UPDATE public.profiles 
SET display_name = COALESCE(
  au.raw_user_meta_data->>'display_name',
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'name',
  CONCAT(au.raw_user_meta_data->>'first_name', ' ', au.raw_user_meta_data->>'last_name'),
  au.raw_user_meta_data->>'first_name',
  split_part(au.email, '@', 1)
)
FROM auth.users au
WHERE profiles.user_id = au.id 
  AND profiles.display_name IS NULL 
  AND au.raw_user_meta_data IS NOT NULL;