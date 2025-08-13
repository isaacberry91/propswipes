-- Create user_push_tokens table for storing device push notification tokens
CREATE TABLE public.user_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable Row Level Security
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own push tokens" 
ON public.user_push_tokens 
FOR SELECT 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = user_push_tokens.user_id ));

CREATE POLICY "Users can insert their own push tokens" 
ON public.user_push_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = user_push_tokens.user_id ));

CREATE POLICY "Users can update their own push tokens" 
ON public.user_push_tokens 
FOR UPDATE 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = user_push_tokens.user_id ));

CREATE POLICY "Users can delete their own push tokens" 
ON public.user_push_tokens 
FOR DELETE 
USING (auth.uid() = ( SELECT profiles.user_id FROM profiles WHERE profiles.id = user_push_tokens.user_id ));

-- Create policy for edge functions to access push tokens
CREATE POLICY "Edge functions can access push tokens" 
ON public.user_push_tokens 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();