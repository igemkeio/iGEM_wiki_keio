# Notion 連携（CMS）ガイド

Notion を原稿置き場（CMS）として使い、本文を Markdown で書くと
`wiki/pages/<slug>.html`（en）/ `wiki/pages/ja/<slug>.html`（ja）が自動生成され、
Next.js（`web/`）がビルドする仕組みです。

```
Notion（Markdown 執筆）→ API 取得 → Markdown 化 → HTML 化 → wiki/pages/*.html → Next.js ビルド
```

> 注意: この仕組みを使うと **Notion が正（source of truth）** になります。
> `wiki/pages/*.html` は同期で上書きされるため、直接編集しないでください。

## 1. Notion Integration を作る

1. https://www.notion.so/my-integrations で「New integration」を作成。
2. 種類は Internal。発行された Secret（`ntn_...`）が `NOTION_TOKEN`。
3. 対象の Database を開き「…」→「Connections」から作った Integration を接続する
   （これをしないと API から見えない）。

## 2. Database を用意する

1 行 = 1 ページ。以下のプロパティを持たせる。

| プロパティ  | 型        | 内容                                    |
| ----------- | --------- | --------------------------------------- |
| `slug`      | Title     | ページのスラッグ。例: `home`, `model`   |
| `locale`    | Select    | `en` または `ja`                        |
| `heading`   | Rich text | `<title>` ブロックの文字列              |
| `lead`      | Rich text | lead ブロック（簡単な HTML 可）         |
| `published` | Checkbox  | 任意。チェックを外した行は同期しない    |

> `heading` は本来 `title` と呼びたいところだが、Notion では title 型プロパティ
> （= `slug`）と名前が衝突して壊れるため `heading` にしている。

本文（page_content）は **各ページの中身に Markdown で執筆**する。
日英はそれぞれ別の行（`locale` で `en` / `ja` を区別、`slug` は共通）。

Database ID は DB の URL に含まれる 32 文字の英数字。

## 3. ローカルで手動同期

```bash
cd web
cp .env.local.example .env.local   # 値を埋める（NOTION_TOKEN / NOTION_DATABASE_ID）
yarn notion:sync                   # wiki/pages/*.html を生成
yarn dev                           # 反映を確認
```

`.env.local` は `.gitignore` 済みでコミットされない。

## 4. GitHub Actions で自動同期

`.github/workflows/notion-sync.yml` が以下を行う。

- 手動実行（Actions タブの「Run workflow」）または毎日 00:00 UTC（09:00 JST）
- `yarn notion:sync` を実行し、差分があれば `chore/notion-sync` ブランチに
  コミットして **PR を自動作成**（`main` へ直接 push はしない）

### 必要な Secrets

リポジトリの Settings → Secrets and variables → Actions に登録:

- `NOTION_TOKEN`（Secret）
- `NOTION_DATABASE_ID`（Secret）
- `NOTION_BUILD_PAGE_ID`（Secret）… Preview URL 等を書き戻す `__build__` 行のページ ID
- `VERCEL_PREVIEW_URL`（Variable）… `chore/notion-sync` ブランチの固定 Preview URL

## 5. Notion のボタンで同期を起動する

Notion のボタンを押す → GitHub Actions が起動 → PR 作成 → Vercel Preview ビルド →
Preview URL を Notion の `__build__` 行に書き戻す、という流れ。

```
Notion ボタン → notion-trigger（Vercel関数）→ workflow_dispatch
  → notion-sync.yml（sync → PR）→ Vercel Preview → __build__ 行へ URL 書き戻し
```

- 中継エンドポイントの実体とデプロイ手順は [`../notion-trigger/README.md`](../notion-trigger/README.md)。
- `__build__` は DB 内の制御行（`published` を外してあり、ページ生成されない）。
  `preview_url` / `pr_url` / `last_synced` プロパティに最新の結果が入る。

### Preview URL について

PR 用ブランチは常に `chore/notion-sync` で固定なので、Vercel のブランチ Preview URL も
一定になる。その URL を `VERCEL_PREVIEW_URL` 変数に入れておくと、毎回 `__build__` 行へ
書き戻される（PR コメントにも Vercel が自動で URL を出す）。
