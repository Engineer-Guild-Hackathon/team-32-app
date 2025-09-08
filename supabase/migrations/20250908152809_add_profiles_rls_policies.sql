-- Create RLS policies for profiles table

-- Policy to allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);