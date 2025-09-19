-- Add policy to allow viewing all items for SNS functionality
CREATE POLICY "Allow public read access to items for SNS" ON public.items
  FOR SELECT
  USING (true);
