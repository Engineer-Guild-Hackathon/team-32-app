-- postsテーブルのcontentカラムをnullableに変更
alter table "public"."posts" alter column "content" drop not null;
