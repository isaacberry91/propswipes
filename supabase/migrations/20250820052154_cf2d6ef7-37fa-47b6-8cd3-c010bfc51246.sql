-- Create table for storing 2FA verification codes
CREATE TABLE public.two_factor_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  contact TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for 2FA codes
CREATE POLICY "Users can view their own 2FA codes" 
ON public.two_factor_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own 2FA codes" 
ON public.two_factor_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA codes" 
ON public.two_factor_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add 2FA fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_method TEXT CHECK (two_factor_method IN ('email', 'sms')),
ADD COLUMN two_factor_contact TEXT;

-- Create index for better performance
CREATE INDEX idx_two_factor_codes_user_id ON public.two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);

-- Auto-cleanup expired codes (optional)
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.two_factor_codes 
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$;