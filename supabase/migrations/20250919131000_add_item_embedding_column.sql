-- Add embedding column to items for storing CLIP vectors
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS embedding vector(512);
