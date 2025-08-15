-- Update the user profile to match the JWT metadata
UPDATE public.profiles 
SET user_type = 'seller'
WHERE user_id = 'ce7ce525-2720-40d9-b925-b0380c982f14';