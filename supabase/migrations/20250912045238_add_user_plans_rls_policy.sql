-- Users can read their own plan
create policy "Users can read their own plan"
  on user_plans for select
  using (auth.uid() = user_id);

-- Only service role can manage plans
create policy "Only service role can insert plans"
  on user_plans for insert
  with check (false);

create policy "Only service role can update plans"
  on user_plans for update
  using (false);

create policy "Only service role can delete plans"
  on user_plans for delete
  using (false);