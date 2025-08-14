-- Create an edge function to handle user account deletion
-- This will be called from the client and will handle the proper deletion process

-- First, let's add a deleted_at column to profiles to track deleted accounts
ALTER TABLE public.profiles 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create an index on deleted_at for performance
CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at);

-- Update RLS policies to exclude deleted profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public can view seller profiles with approved properties" ON public.profiles;
CREATE POLICY "Public can view seller profiles with approved properties"
ON public.profiles
FOR SELECT
USING (
  user_type = 'seller'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.owner_id = profiles.id 
    AND properties.status = 'approved'
  )
);