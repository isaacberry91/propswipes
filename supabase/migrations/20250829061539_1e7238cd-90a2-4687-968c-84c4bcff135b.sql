-- Create table to store Apple ID mappings for subsequent logins
CREATE TABLE public.apple_id_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apple_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apple_id_mappings ENABLE ROW LEVEL SECURITY;

-- Users can view their own Apple ID mapping
CREATE POLICY "Users can view their own apple id mapping" 
ON public.apple_id_mappings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own Apple ID mapping
CREATE POLICY "Users can insert their own apple id mapping" 
ON public.apple_id_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own Apple ID mapping
CREATE POLICY "Users can update their own apple id mapping" 
ON public.apple_id_mappings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_apple_id_mappings_updated_at
BEFORE UPDATE ON public.apple_id_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();