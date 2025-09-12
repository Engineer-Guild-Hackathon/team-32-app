-- API usage rate limiting tables and functions

-- Table to track daily API usage per user
create table if not exists daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  ymd date not null,
  used int not null default 0,
  inflight int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, ymd)
);

-- Table to track individual usage requests
create table if not exists usage_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  ymd date not null,
  request_id text not null,
  status text not null check (status in ('reserved', 'done', 'canceled')),
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, ymd, request_id)
);

-- Create indexes for better performance
create index if not exists idx_usage_requests_reserved_at on usage_requests (reserved_at);
create index if not exists idx_usage_requests_status on usage_requests (status);
create index if not exists idx_daily_usage_ymd on daily_usage (ymd);

-- Function to reserve API usage
create or replace function reserve_usage(
  p_user_id uuid,
  p_ymd date,
  p_request_id text,
  p_limit int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_record record;
begin
  -- Ensure daily_usage record exists (create if not exists)
  insert into daily_usage(user_id, ymd)
  values (p_user_id, p_ymd)
  on conflict (user_id, ymd) do nothing;

  -- Idempotency check - return true if request already exists
  if exists(
    select 1 from usage_requests
    where user_id = p_user_id
      and ymd = p_ymd
      and request_id = p_request_id
  ) then
    return true;
  end if;

  -- Atomic check and update (check daily limit including inflight requests)
  update daily_usage
  set inflight = inflight + 1,
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and (used + inflight) < p_limit  -- Check total usage including inflight
  returning * into v_record;

  -- Return false if update failed (limit exceeded)
  if not found then
    return false;
  end if;

  -- Record the request
  insert into usage_requests(user_id, ymd, request_id, status)
  values (p_user_id, p_ymd, p_request_id, 'reserved');

  return true;
end;
$$;

-- Function to finalize successful API usage
create or replace function finalize_usage_success(
  p_user_id uuid,
  p_ymd date,
  p_request_id text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Decrement inflight and increment used count
  update daily_usage
  set inflight = greatest(inflight - 1, 0),
      used = used + 1,
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd;

  -- Update request status to completed
  update usage_requests
  set status = 'done',
      completed_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and request_id = p_request_id;
end;
$$;

-- Function to finalize failed API usage
create or replace function finalize_usage_failure(
  p_user_id uuid,
  p_ymd date,
  p_request_id text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Decrement inflight count (no change to used count)
  update daily_usage
  set inflight = greatest(inflight - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and ymd = p_ymd;

  -- Update request status to canceled
  update usage_requests
  set status = 'canceled',
      completed_at = now()
  where user_id = p_user_id
    and ymd = p_ymd
    and request_id = p_request_id;
end;
$$;

-- Function to get current usage status
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
as $$
declare
  v_used int;
  v_inflight int;
begin
  -- Get current usage including inflight
  select coalesce(du.used, 0), coalesce(du.inflight, 0)
  into v_used, v_inflight
  from daily_usage du
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

-- Enable Row Level Security
alter table daily_usage enable row level security;
alter table usage_requests enable row level security;

-- RLS policies - users can only access their own data
create policy "Users can view own daily usage"
  on daily_usage for select
  using (auth.uid() = user_id);

create policy "Users can view own usage requests"
  on usage_requests for select
  using (auth.uid() = user_id);

-- System policies for insert/update (via functions)
create policy "System can insert daily usage"
  on daily_usage for insert
  with check (auth.uid() = user_id);

create policy "System can update daily usage"
  on daily_usage for update
  using (auth.uid() = user_id);

create policy "System can insert usage requests"
  on usage_requests for insert
  with check (auth.uid() = user_id);

create policy "System can update usage requests"
  on usage_requests for update
  using (auth.uid() = user_id);