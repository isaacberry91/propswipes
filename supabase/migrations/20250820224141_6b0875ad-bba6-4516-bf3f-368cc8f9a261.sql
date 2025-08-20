-- Add column to track when the 24-hour like period started
ALTER TABLE profiles 
ADD COLUMN daily_likes_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing users who have used likes to start their timer from today
UPDATE profiles 
SET daily_likes_started_at = NOW() 
WHERE daily_likes_used > 0 AND daily_likes_started_at IS NULL;