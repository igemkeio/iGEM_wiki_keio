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
| `title`     | Rich text | `<title>` ブロックの文字列              |
| `lead`      | Rich text | lead ブロック（簡単な HTML 可）         |
| `published` | Checkbox  | 任意。チェックを外した行は同期しない    |

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

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
