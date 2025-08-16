-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- Create policies for chat attachments
CREATE POLICY "Users can view their own chat attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own chat attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachment fields to messages table
ALTER TABLE messages 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT,
ADD COLUMN attachment_name TEXT;