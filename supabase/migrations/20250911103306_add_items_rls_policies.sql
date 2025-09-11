-- Create RLS policies for items table

-- Policy for users to view their own items
CREATE POLICY "Users can view own items" ON public.items
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Policy for users to insert their own items
CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy for users to update their own items
CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy for users to delete their own items
CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);