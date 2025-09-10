-- Create RLS policies for profiles table

-- Policy to allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE
  USING ((SELECT auth.uid()) = id);