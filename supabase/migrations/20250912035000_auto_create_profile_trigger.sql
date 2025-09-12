-- トリガー関数は search_path を固定し、plan は明示キャスト
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile
  insert into public.profiles (id)
  values (new.id);

  -- Create default plan（public.plan を明示）
  insert into public.user_plans (user_id, plan)
  values (new.id, 'free'::public.plan);

  return new;
end;
$$;

-- AFTER INSERT trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
