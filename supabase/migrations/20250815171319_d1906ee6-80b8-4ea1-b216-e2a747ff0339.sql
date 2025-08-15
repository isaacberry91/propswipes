-- Create a trigger function to send push notifications when messages are created
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
  
  -- Call the edge function to send push notification (run in background)
  PERFORM
    net.http_post(
      url := concat(
        current_setting('app.supabase_url', true),
        '/functions/v1/send-push-notification'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key', true))
      ),
      body := jsonb_build_object(
        'recipientUserId', recipient_profile_id,
        'senderId', sender_profile_id,
        'messageContent', NEW.content,
        'matchId', NEW.match_id
      )
    );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically send notifications on new messages
DROP TRIGGER IF EXISTS trigger_notify_message_recipient ON messages;
CREATE TRIGGER trigger_notify_message_recipient
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_recipient();