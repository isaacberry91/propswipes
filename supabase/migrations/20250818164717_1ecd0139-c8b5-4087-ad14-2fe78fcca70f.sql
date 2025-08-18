-- Add deleted_at column to properties table for soft delete functionality
ALTER TABLE public.properties 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update RLS policies to exclude deleted properties from normal views
-- First drop the existing policy for viewing approved properties
DROP POLICY "Everyone can view approved properties" ON public.properties;

-- Recreate the policy to exclude soft-deleted properties
CREATE POLICY "Everyone can view approved properties" 
ON public.properties 
FOR SELECT 
USING (status = 'approved'::property_status AND deleted_at IS NULL);

-- Update the user's own property view policy to exclude soft-deleted properties
DROP POLICY "Users can view their own properties" ON public.properties;

CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (owner_id = get_user_profile_id_for_auth_user() AND deleted_at IS NULL);

-- Allow users to soft delete their own properties by updating deleted_at
CREATE POLICY "Users can soft delete their own properties" 
ON public.properties 
FOR UPDATE 
USING (owner_id = get_user_profile_id_for_auth_user())
WITH CHECK (owner_id = get_user_profile_id_for_auth_user());

-- Admin policy to view all properties including deleted ones
CREATE POLICY "Admins can view all properties including deleted" 
ON public.properties 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));

-- Update the properties table trigger to exclude soft-deleted properties from swipe suggestions
-- We need to make sure the property_swipes trigger doesn't create matches for deleted properties