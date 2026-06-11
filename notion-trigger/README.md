# notion-trigger

Notion のボタンから GitHub Actions（`notion-sync.yml`）を起動するための中継エンドポイント。
Notion の標準ボタンは「リンクを開く（GET）」しかできず、GitHub の dispatch API
（POST + 認証ヘッダ）を直接叩けないため、トークンを持つこの小さな関数を間に挟む。

```
Notion ボタン（GET ?key=…）
  → /api/trigger（このVercel関数・GITHUB_TOKENを保持）
  → POST workflow_dispatch
  → GitHub Actions: notion-sync.yml 起動
```

## デプロイ手順（Vercel）

1. この `notion-trigger/` ディレクトリを**独立した Vercel プロジェクト**としてデプロイする
   （wiki 本体は静的エクスポートで API を持てないため別プロジェクトにする）。
   - Vercel ダッシュボード → Add New Project → 同じ GitHub リポジトリを選択し、
     Root Directory に `notion-trigger` を指定。
2. Project Settings → Environment Variables に `.env.example` の値を設定。
   - `GITHUB_TOKEN`: fine-grained PAT。対象リポジトリに対し
     **Actions: Read and write** と **Contents: Read and write** を付与。
   - `TRIGGER_SECRET`: 長いランダム文字列。
3. デプロイ後の URL を控える: `https://<project>.vercel.app/api/trigger?key=<TRIGGER_SECRET>`

## Notion 側のボタン設置

1. Notion の任意のページ（DB 上部など）に **Button** ブロックを追加。
2. アクションは **「リンクを開く（Open link）」** を選び、上の URL を貼る。
3. ボタンを押すと同期が走り、PR と Vercel Preview が作られる。

## ローカル確認

```bash
cd notion-trigger
# 環境変数を渡して Vercel CLI で起動（要 `npm i -g vercel`）
vercel dev
# 別シェルで
curl "http://localhost:3000/api/trigger?key=<TRIGGER_SECRET>"
```
