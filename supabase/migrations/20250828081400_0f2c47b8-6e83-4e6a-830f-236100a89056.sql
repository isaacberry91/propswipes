
-- Create privacy_settings table to store user privacy preferences
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'matches_only', 'private')),
  show_location BOOLEAN NOT NULL DEFAULT true,
  show_phone BOOLEAN NOT NULL DEFAULT false,
  show_email BOOLEAN NOT NULL DEFAULT false,
  allow_messages_from TEXT NOT NULL DEFAULT 'matches_only' CHECK (allow_messages_from IN ('everyone', 'matches_only', 'none')),
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS on privacy_settings table
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for privacy_settings
CREATE POLICY "Users can view their own privacy settings" 
  ON public.privacy_settings 
  FOR SELECT 
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own privacy settings" 
  ON public.privacy_settings 
  FOR INSERT 
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own privacy settings" 
  ON public.privacy_settings 
  FOR UPDATE 
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Create function to get profile data respecting privacy settings
CREATE OR REPLACE FUNCTION public.get_profile_respecting_privacy(
  target_profile_id UUID,
  requesting_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  user_type user_type,
  bio TEXT,
  phone TEXT,
  location TEXT,
  show_contact_info BOOLEAN
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH requesting_profile AS (
    SELECT profiles.id as profile_id
    FROM profiles 
    WHERE profiles.user_id = requesting_user_id
    LIMIT 1
  ),
  privacy_settings AS (
    SELECT * FROM public.privacy_settings ps
    WHERE ps.profile_id = target_profile_id
  ),
  has_match AS (
    SELECT EXISTS(
      SELECT 1 FROM matches m, requesting_profile rp
      WHERE (m.buyer_id = target_profile_id AND m.seller_id = rp.profile_id)
         OR (m.seller_id = target_profile_id AND m.buyer_id = rp.profile_id)
    ) as is_matched
  )
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.user_type,
    p.bio,
    CASE 
      WHEN ps.show_phone = true AND (
        ps.profile_visibility = 'public' OR 
        (ps.profile_visibility = 'matches_only' AND hm.is_matched = true) OR
        p.user_id = requesting_user_id
      ) THEN p.phone 
      ELSE NULL 
    END as phone,
    CASE 
      WHEN ps.show_location = true AND (
        ps.profile_visibility = 'public' OR 
        (ps.profile_visibility = 'matches_only' AND hm.is_matched = true) OR
        p.user_id = requesting_user_id
      ) THEN p.location 
      ELSE NULL 
    END as location,
    CASE 
      WHEN ps.profile_visibility = 'public' OR 
           (ps.profile_visibility = 'matches_only' AND hm.is_matched = true) OR
           p.user_id = requesting_user_id
      THEN true 
      ELSE false 
    END as show_contact_info
  FROM profiles p
  LEFT JOIN privacy_settings ps ON ps.profile_id = p.id
  LEFT JOIN has_match hm ON true
  WHERE p.id = target_profile_id 
    AND p.deleted_at IS NULL
    AND (
      ps.profile_visibility = 'public' OR
      (ps.profile_visibility = 'matches_only' AND hm.is_matched = true) OR
      ps.profile_visibility = 'private' AND p.user_id = requesting_user_id OR
      ps.profile_visibility IS NULL -- Default to public if no settings
    );
$$;

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
