-- Add listing_type column to properties table
ALTER TABLE public.properties 
ADD COLUMN listing_type TEXT NOT NULL DEFAULT 'for-sale';

-- Add check constraint to ensure only valid listing types
ALTER TABLE public.properties 
ADD CONSTRAINT valid_listing_type 
CHECK (listing_type IN ('for-sale', 'for-rent'));

-- Create index for better query performance
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);

-- Update existing properties to have a default listing_type
UPDATE public.properties 
SET listing_type = 'for-sale' 
WHERE listing_type IS NULL;