-- Update the current user's daily likes to match their actual swipe count for testing
UPDATE profiles 
SET daily_likes_used = (
  SELECT COUNT(*) 
  FROM property_swipes 
  WHERE user_id = profiles.id 
  AND is_liked = true 
  AND DATE(created_at) = CURRENT_DATE
)
WHERE user_id = 'ec657acc-0353-4eb1-bd82-38b1f7021ddc';