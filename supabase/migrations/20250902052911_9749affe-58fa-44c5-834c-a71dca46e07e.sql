-- Create storage bucket for chat voice notes and attachments (idempotent)
insert into storage.buckets (id, name, public) values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- Allow users to upload files only into their own folder (first path segment equals auth.uid())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can upload their own chat attachments'
  ) THEN
    CREATE POLICY "Users can upload their own chat attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'chat-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow users to read their own files so they can generate signed URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can read their own chat attachments'
  ) THEN
    CREATE POLICY "Users can read their own chat attachments"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- (Optional) Allow users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can delete their own chat attachments'
  ) THEN
    CREATE POLICY "Users can delete their own chat attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'chat-attachments'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;