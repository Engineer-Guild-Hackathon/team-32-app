-- 自分のプランは読める
drop policy if exists "Users can read their own plan" on public.user_plans;
create policy "Users can read their own plan"
  on public.user_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

-- サービスレイヤ（DBロール service_role）だけ管理可能
drop policy if exists "Only service role can insert plans" on public.user_plans;
create policy "Only service role can insert plans"
  on public.user_plans
  for insert
  to service_role
  with check (true);

drop policy if exists "Only service role can update plans" on public.user_plans;
create policy "Only service role can update plans"
  on public.user_plans
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists "Only service role can delete plans" on public.user_plans;
create policy "Only service role can delete plans"
  on public.user_plans
  for delete
  to service_role
  using (true);
