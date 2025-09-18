-- SNS機能用のテーブル作成

-- 投稿テーブル
create table "public"."posts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "content" text not null,
    "image_url" text,
    "is_public" boolean not null default true,
    "likes_count" integer not null default 0,
    "comments_count" integer not null default 0,
    constraint "posts_pkey" primary key ("id")
);

-- フォローテーブル
create table "public"."follows" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "follower_id" uuid not null references auth.users(id) on delete cascade,
    "following_id" uuid not null references auth.users(id) on delete cascade,
    constraint "follows_pkey" primary key ("id"),
    constraint "follows_follower_following_key" unique ("follower_id", "following_id")
);

-- いいねテーブル
create table "public"."likes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "post_id" uuid not null references public.posts(id) on delete cascade,
    constraint "likes_pkey" primary key ("id"),
    constraint "likes_user_post_key" unique ("user_id", "post_id")
);

-- コメントテーブル
create table "public"."comments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "post_id" uuid not null references public.posts(id) on delete cascade,
    "content" text not null,
    "parent_id" uuid references public.comments(id) on delete cascade,
    constraint "comments_pkey" primary key ("id")
);

-- インデックス作成
create index "posts_user_id_idx" on "public"."posts" ("user_id");
create index "posts_created_at_idx" on "public"."posts" ("created_at" desc);
create index "posts_is_public_idx" on "public"."posts" ("is_public");
create index "follows_follower_id_idx" on "public"."follows" ("follower_id");
create index "follows_following_id_idx" on "public"."follows" ("following_id");
create index "likes_user_id_idx" on "public"."likes" ("user_id");
create index "likes_post_id_idx" on "public"."likes" ("post_id");
create index "comments_post_id_idx" on "public"."comments" ("post_id");
create index "comments_user_id_idx" on "public"."comments" ("user_id");


-- RLS有効化
alter table "public"."posts" enable row level security;
alter table "public"."follows" enable row level security;
alter table "public"."likes" enable row level security;
alter table "public"."comments" enable row level security;

-- 投稿のRLSポリシー
create policy "Posts are viewable by everyone" on "public"."posts"
    for select using (is_public = true);

create policy "Users can view their own posts" on "public"."posts"
    for select using (auth.uid() = user_id);

create policy "Users can insert their own posts" on "public"."posts"
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts" on "public"."posts"
    for update using (auth.uid() = user_id);

create policy "Users can delete their own posts" on "public"."posts"
    for delete using (auth.uid() = user_id);

-- フォローのRLSポリシー
create policy "Users can view all follows" on "public"."follows"
    for select using (true);

create policy "Users can insert their own follows" on "public"."follows"
    for insert with check (auth.uid() = follower_id);

create policy "Users can delete their own follows" on "public"."follows"
    for delete using (auth.uid() = follower_id);

-- いいねのRLSポリシー
create policy "Users can view all likes" on "public"."likes"
    for select using (true);

create policy "Users can insert their own likes" on "public"."likes"
    for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes" on "public"."likes"
    for delete using (auth.uid() = user_id);

-- コメントのRLSポリシー
create policy "Users can view all comments" on "public"."comments"
    for select using (true);

create policy "Users can insert their own comments" on "public"."comments"
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own comments" on "public"."comments"
    for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on "public"."comments"
    for delete using (auth.uid() = user_id);

-- 権限設定
grant all on table "public"."posts" to "authenticated";
grant all on table "public"."follows" to "authenticated";
grant all on table "public"."likes" to "authenticated";
grant all on table "public"."comments" to "authenticated";

-- いいね数の更新関数
create or replace function update_post_likes_count()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        update public.posts 
        set likes_count = likes_count + 1 
        where id = NEW.post_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.posts 
        set likes_count = likes_count - 1 
        where id = OLD.post_id;
        return OLD;
    end if;
    return null;
end;
$$ language plpgsql;

-- コメント数の更新関数
create or replace function update_post_comments_count()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        update public.posts 
        set comments_count = comments_count + 1 
        where id = NEW.post_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.posts 
        set comments_count = comments_count - 1 
        where id = OLD.post_id;
        return OLD;
    end if;
    return null;
end;
$$ language plpgsql;

-- トリガー作成
create trigger update_likes_count_trigger
    after insert or delete on public.likes
    for each row execute function update_post_likes_count();

create trigger update_comments_count_trigger
    after insert or delete on public.comments
    for each row execute function update_post_comments_count();
