-- Create private users storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'users', 
  'users', 
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the users bucket
CREATE POLICY "users_insert_policy" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'users' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_update_policy" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'users' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'users' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_delete_policy" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'users' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_select_policy" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'users' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );