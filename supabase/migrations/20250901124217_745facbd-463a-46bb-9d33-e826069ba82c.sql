-- Add videos column to properties table
ALTER TABLE public.properties 
ADD COLUMN videos text[] DEFAULT '{}';

-- Add comment to document the videos column
COMMENT ON COLUMN public.properties.videos IS 'Array of video URLs for property videos (max 20MB each)';