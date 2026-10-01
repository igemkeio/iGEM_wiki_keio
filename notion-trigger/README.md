# notion-trigger

NotionのボタンからGitHub Actions(`notion-sync.yml`)を起動するための中継エンドポイント。Notionの標準ボタンは、リンクを開く(GET)しかできず、GitHubのdispatch API(POSTと認証ヘッダ)を直接叩けない。そこで、トークンを持つこの小さな関数を間に挟む。

```
Notionのボタン(GET ?key=...)
  → /api/trigger(このVercel関数。GITHUB_TOKENを保持)
  → POST workflow_dispatch
  → GitHub Actions: notion-sync.ymlが起動
```

## デプロイ手順(Vercel)

1. この`notion-trigger/`を独立したVercelプロジェクトとしてデプロイする(wiki本体は静的ファイルだけでAPIを持てないため、別プロジェクトにする)。
   - Vercelのダッシュボードで、Add New Projectから同じGitHubリポジトリを選び、Root Directoryに`notion-trigger`を指定する。
2. Project SettingsのEnvironment Variablesに、`.env.example`の値を設定する。
   - `GITHUB_TOKEN`: fine-grained PAT。対象リポジトリに、ActionsとContentsにRead and writeを付与する。
   - `TRIGGER_SECRET`: 長いランダム文字列。
3. デプロイ後のURLを控える: `https://<project>.vercel.app/api/trigger?key=<TRIGGER_SECRET>`

## Notion側のボタンの設置

1. Notionの任意のページ(DBの上部など)にButtonブロックを追加する。
2. アクションはリンクを開く(Open link)を選び、上のURLを貼る。
3. ボタンを押すと同期が走り、PRとVercelのプレビューが作られる。

## ローカルでの確認

```sh
cd notion-trigger
# 環境変数を渡してVercel CLIで起動する(npm i -g vercelが要る)
vercel dev
# 別のシェルで
curl "http://localhost:3000/api/trigger?key=<TRIGGER_SECRET>"
```
