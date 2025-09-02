-- Add duration column to messages table for voice notes
ALTER TABLE public.messages 
ADD COLUMN duration_seconds integer;