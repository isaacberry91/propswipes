-- Drop the existing trigger and function that uses net extension
DROP TRIGGER IF EXISTS trigger_notify_message_recipient ON messages;
DROP FUNCTION IF EXISTS notify_message_recipient();

-- Create a simplified notification function that doesn't use net extension
-- Instead, we'll handle push notifications from the client side
CREATE OR REPLACE FUNCTION notify_message_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recipient_profile_id uuid;
  sender_profile_id uuid;
  match_record RECORD;
BEGIN
  -- Get the match details
  SELECT * INTO match_record
  FROM matches 
  WHERE id = NEW.match_id;
  
  -- Determine who is the recipient (not the sender)
  IF match_record.buyer_id = NEW.sender_id THEN
    recipient_profile_id := match_record.seller_id;
  ELSE
    recipient_profile_id := match_record.buyer_id;
  END IF;
  
  sender_profile_id := NEW.sender_id;
  
  -- Log the notification details for debugging
  RAISE NOTICE 'Message notification: recipient=%, sender=%, match=%, content=%', 
    recipient_profile_id, sender_profile_id, NEW.match_id, NEW.content;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically handle message notifications
CREATE TRIGGER trigger_notify_message_recipient
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_recipient();