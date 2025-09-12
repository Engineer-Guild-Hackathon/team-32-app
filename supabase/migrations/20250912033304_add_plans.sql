-- ENUM 型は必ずスキーマ修飾
create type public.plan as enum ('free', 'pro');

-- カラム型と DEFAULT は public.plan を明示
create table public.user_plans (
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  plan       public.plan not null default 'free'::public.plan
);

-- RLS は後続ポリシーで制御
alter table public.user_plans enable row level security;

-- PK
create unique index user_plans_pkey on public.user_plans using btree (user_id);
alter table public.user_plans add constraint user_plans_pkey primary key using index user_plans_pkey;

-- FK はスキーマ明示 + トランザクション終端まで遅延（順序揺れに強くする）
alter table public.user_plans
  add constraint user_plans_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade
  deferrable initially deferred not valid;
alter table public.user_plans validate constraint user_plans_user_id_fkey;

-- Grants（必要なら残す。Supabase では RLS が最終ゲート）
grant delete, insert, references, select, trigger, truncate, update on table public.user_plans to anon;
grant delete, insert, references, select, trigger, truncate, update on table public.user_plans to authenticated;
grant delete, insert, references, select, trigger, truncate, update on table public.user_plans to service_role;
