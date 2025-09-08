このプロジェクトでは、データベース、認証、ストレージなどのバックエンド機能を提供するために[Supabase](https://supabase.com/) を使用しています。Supabaseは、PostgreSQLをベースにしたサービスです。

ローカル環境での開発には、Supabase CLIを使用します。

# Supabase CLIの使い方

## Dockerの準備
Supabase CLIの起動にはDockerが必要です。Dockerが無い場合は、[Docker Desktop](https://www.docker.com/ja-jp/products/docker-desktop/)か[OrbStack](https://orbstack.dev/)をインストールしてください。

## 起動
```
npx supabase start
```
初回は時間がかかります。

## 環境変数の設定
初回のみ、下記のコマンドを実行してください。
```
npx supabase status -o env > .env.local
```
`.env.local`というファイルが作成されます。このファイルにある`ANON_KEY`と`API_URL`という変数名を、それぞれ`NEXT_PUBLIC_SUPABASE_ANON_KEY`と`NEXT_PUBLIC_SUPABASE_URL`に変更してください。

## Supabase Studio
Supabase Studioは、Supabaseの管理画面です。[http://localhost:54323/](http://localhost:54323/)にアクセスして使用します。

## 停止
```
npx supabase stop
```
