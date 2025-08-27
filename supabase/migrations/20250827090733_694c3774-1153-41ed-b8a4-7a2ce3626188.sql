-- Create notifications table for property likes and other activities
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL,
  sender_id UUID,
  property_id UUID,
  notification_type TEXT NOT NULL DEFAULT 'property_liked',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (recipient_id = get_user_profile_id_for_auth_user());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (recipient_id = get_user_profile_id_for_auth_user());

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = ANY (ARRAY['admin@propswipes.com'::text, 'support@propswipes.com'::text, 'isaacberry91@yahoo.com'::text, 'ankur@furrisic.com'::text, 'developer@furrisic.com'::text]));

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify property owner when liked
CREATE OR REPLACE FUNCTION public.notify_property_liked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  property_owner_id uuid;
  liker_profile_id uuid;
  property_title text;
  liker_name text;
BEGIN
  -- Only process likes (not dislikes)
  IF NEW.is_liked = false THEN
    RETURN NEW;
  END IF;

  -- Get the property owner's profile ID and title
  SELECT owner_id, title INTO property_owner_id, property_title
  FROM properties 
  WHERE id = NEW.property_id;

  -- Get the liker's profile ID and name
  SELECT id, COALESCE(display_name, 'Someone') INTO liker_profile_id, liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't notify if user likes their own property
  IF property_owner_id = liker_profile_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for property owner
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    property_id,
    notification_type,
    title,
    message
  ) VALUES (
    property_owner_id,
    liker_profile_id,
    NEW.property_id,
    'property_liked',
    'Your property was liked!',
    liker_name || ' liked your property "' || property_title || '"'
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for property likes
CREATE TRIGGER on_property_liked
  AFTER INSERT ON property_swipes
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_property_liked();