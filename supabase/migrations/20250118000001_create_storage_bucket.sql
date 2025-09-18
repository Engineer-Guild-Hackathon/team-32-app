-- ストレージバケットを作成
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- ストレージポリシーを設定
create policy "Public images are viewable by everyone"
on storage.objects for select
using (bucket_id = 'images');

create policy "Authenticated users can upload images"
on storage.objects for insert
with check (
  bucket_id = 'images' 
  and auth.role() = 'authenticated'
);

create policy "Users can update their own images"
on storage.objects for update
using (
  bucket_id = 'images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
