-- Update existing iOS tokens to use FCM platform
UPDATE user_push_tokens 
SET platform = 'fcm' 
WHERE platform = 'ios';