-- Update the existing profile to undelete it and allow the user to access the app
UPDATE profiles 
SET deleted_at = NULL, updated_at = NOW()
WHERE user_id = 'b4f33534-1008-4b57-93db-c13dff4cabd5';