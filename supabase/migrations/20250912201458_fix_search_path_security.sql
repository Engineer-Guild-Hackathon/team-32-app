-- Fix security issue: Set search_path to empty string to prevent schema injection attacks

-- Fix handle_new_user function  
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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

-- Fix reserve_usage function
create or replace function reserve_usage(
  p_user_id uuid,
  p_ymd date,
  p_request_id text,
  p_limit int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Ensure daily_usage record exists (create if not exists)
  insert into public.daily_usage(user_id, ymd)
  values (p_user_id, p_ymd)
  on conflict (user_id, ymd) do nothing;

  -- Idempotency check - return true if request already exists
  if exists(
    select 1 from public.usage_requests
    where user_id = p_user_id
      and ymd = p_ymd
      and request_id = p_request_id
  ) then
    return true;
  end if;

  -- Atomic check and update (check daily limit including inflight requests)
  update public.daily_usage
  set inflight = inflight + 1,
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and (used + inflight) < p_limit;  -- Check total usage including inflight

  -- Return false if update failed (limit exceeded)
  if not found then
    return false;
  end if;

  -- Record the request
  insert into public.usage_requests(user_id, ymd, request_id, status)
  values (p_user_id, p_ymd, p_request_id, 'reserved');

  return true;
end;
$$;

-- Fix finalize_usage_success function
create or replace function finalize_usage_success(
  p_user_id uuid,
  p_ymd date,
  p_request_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Decrement inflight and increment used count
  update public.daily_usage
  set inflight = greatest(inflight - 1, 0),
      used = used + 1,
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd;

  -- Update request status to completed
  update public.usage_requests
  set status = 'done',
      completed_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and request_id = p_request_id;
end;
$$;

-- Fix finalize_usage_failure function
create or replace function finalize_usage_failure(
  p_user_id uuid,
  p_ymd date,
  p_request_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Decrement inflight count (no change to used count)
  update public.daily_usage
  set inflight = greatest(inflight - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd;

  -- Update request status to canceled
  update public.usage_requests
  set status = 'canceled',
      completed_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and request_id = p_request_id;
end;
$$;

-- Fix get_usage_status function
create or replace function get_usage_status(
  p_user_id uuid,
  p_limit int,
  p_ymd date default current_date
)
returns table(
  used int,
  inflight int,
  remaining int,
  can_reserve boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used int;
  v_inflight int;
begin
  -- Get current usage including inflight
  select coalesce(du.used, 0), coalesce(du.inflight, 0)
  into v_used, v_inflight
  from public.daily_usage du
  where du.user_id = p_user_id
    and du.ymd = p_ymd;

  -- Set defaults if no data found
  if not found then
    v_used := 0;
    v_inflight := 0;
  end if;

  return query
  select
    v_used as used,
    v_inflight as inflight,
    greatest(p_limit - v_used - v_inflight, 0) as remaining,
    (v_used + v_inflight < p_limit) as can_reserve;
end;
$$;