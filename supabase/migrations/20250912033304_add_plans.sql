create type "public"."plan" as enum ('free', 'pro');

create table "public"."user_plans" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "plan" plan not null default 'free'::plan
);


alter table "public"."user_plans" enable row level security;

CREATE UNIQUE INDEX user_plans_pkey ON public.user_plans USING btree (user_id);

alter table "public"."user_plans" add constraint "user_plans_pkey" PRIMARY KEY using index "user_plans_pkey";

alter table "public"."user_plans" add constraint "user_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_plans" validate constraint "user_plans_user_id_fkey";

grant delete on table "public"."user_plans" to "anon";

grant insert on table "public"."user_plans" to "anon";

grant references on table "public"."user_plans" to "anon";

grant select on table "public"."user_plans" to "anon";

grant trigger on table "public"."user_plans" to "anon";

grant truncate on table "public"."user_plans" to "anon";

grant update on table "public"."user_plans" to "anon";

grant delete on table "public"."user_plans" to "authenticated";

grant insert on table "public"."user_plans" to "authenticated";

grant references on table "public"."user_plans" to "authenticated";

grant select on table "public"."user_plans" to "authenticated";

grant trigger on table "public"."user_plans" to "authenticated";

grant truncate on table "public"."user_plans" to "authenticated";

grant update on table "public"."user_plans" to "authenticated";

grant delete on table "public"."user_plans" to "service_role";

grant insert on table "public"."user_plans" to "service_role";

grant references on table "public"."user_plans" to "service_role";

grant select on table "public"."user_plans" to "service_role";

grant trigger on table "public"."user_plans" to "service_role";

grant truncate on table "public"."user_plans" to "service_role";

grant update on table "public"."user_plans" to "service_role";


