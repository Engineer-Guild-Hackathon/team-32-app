-- Fix RLS performance issues: Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- Fix daily_usage table policies
DROP POLICY IF EXISTS "Users can view own daily usage" ON public.daily_usage;
CREATE POLICY "Users can view own daily usage"
  ON public.daily_usage FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can insert daily usage" ON public.daily_usage;
CREATE POLICY "System can insert daily usage"
  ON public.daily_usage FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can update daily usage" ON public.daily_usage;
CREATE POLICY "System can update daily usage"
  ON public.daily_usage FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Fix usage_requests table policies
DROP POLICY IF EXISTS "Users can view own usage requests" ON public.usage_requests;
CREATE POLICY "Users can view own usage requests"
  ON public.usage_requests FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can insert usage requests" ON public.usage_requests;
CREATE POLICY "System can insert usage requests"
  ON public.usage_requests FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can update usage requests" ON public.usage_requests;
CREATE POLICY "System can update usage requests"
  ON public.usage_requests FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Fix user_plans table policy - remove old policy and create unified one
DROP POLICY IF EXISTS "Users can read their own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON public.user_plans;
CREATE POLICY "Users can view own plan"
  ON public.user_plans FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Fix storage bucket policies for images
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_0" ON storage.objects;
CREATE POLICY "Give users authenticated access to folder 1oj01fe_0"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
CREATE POLICY "Give users authenticated access to folder 1oj01fe_1"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;
CREATE POLICY "Give users authenticated access to folder 1oj01fe_2"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_3" ON storage.objects;
CREATE POLICY "Give users authenticated access to folder 1oj01fe_3"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);