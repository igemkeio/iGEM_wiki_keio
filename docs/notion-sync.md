# Notion 連携（CMS）ガイド

Notion を原稿置き場（CMS）として使い、本文を Markdown で書くと
`content/<locale>/<slug>.json` が自動生成される仕組みです。JSON の形式は
[`../content/README.md`](../content/README.md) にあります。

```
Notion（Markdown 執筆）→ API 取得 → Markdown 化 → HTML 化 → content/<locale>/<slug>.json
```

> 注意: この仕組みを使うと **Notion が正（source of truth）** になります。
> `content/**/*.json` は同期で上書きされ、Notion に無くなったページの JSON は削除されるため、
> 直接編集しないでください。`content/README.md` は削除されません。

移行中は環境変数 `NOTION_SYNC_LEGACY_HTML=1` を付けると、従来の
`wiki/pages/<slug>.html`（en）/ `wiki/pages/ja/<slug>.html`（ja）も出力します
（`main` の Next.js 版が読む形式）。既定では JSON だけを出します。

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
| `heading`   | Rich text | ページの見出し（JSON の `title`）       |
| `lead`      | Rich text | リード文（簡単な HTML 可）              |
| `order`     | Number    | 任意。ナビと Home のカードの並び順      |
| `subtitle`  | Rich text | 任意。見出しの下の小見出し              |
| `published` | Checkbox  | 任意。チェックを外した行は同期しない    |

> `heading` は本来 `title` と呼びたいところだが、Notion では title 型プロパティ
> （= `slug`）と名前が衝突して壊れるため `heading` にしている。

`order` と `subtitle` は DB に人がプロパティを追加する（Notion の DB の + ボタンから、
名前と型を上の表どおりにする）。無い場合は省略として扱い、同期は失敗しない。
`home` の `order` は `0` にする。

`slug` は小文字英数字とハイフンだけに正規化される（大文字は小文字に、空白とアンダースコアは
ハイフンに変え、それ以外の文字は除く）。変わった場合は同期のログに出る。

本文（page_content）は **各ページの中身に Markdown で執筆**する。
日英はそれぞれ別の行（`locale` で `en` / `ja` を区別、`slug` は共通）。

Database ID は DB の URL に含まれる 32 文字の英数字。

### Notion のブロックと HTML の対応

| Notion のブロック | 出力 |
| --- | --- |
| 見出し 2、見出し 3 | `<h2 id="...">`、`<h3 id="...">`。id は見出しの文字列を小文字化し、空白をハイフンに、句読点と記号を除いたもの（日本語は残す）。重複は `-2`、`-3` |
| equation（ブロック数式）、文中の数式 | KaTeX で描画した HTML |
| callout | `<aside class="note"><p class="note__label">Note</p>...</aside>`。アイコンは捨てる |
| キャプション付きの image | `<figure class="figure-card">`。キャプションが `Fig. N` で始まれば `figure-card__label` に、残りを `figure-card__title` にする |
| キャプションなしの image | `<img>` |

HTML の形は [`../content/README.md`](../content/README.md) の FigureカードとNoteのHTMLの形 の節にある。

### 画像の扱い（暫定）

Notion 本文に貼った画像は、同期時に `web/public/notion-images/<ハッシュ>.<拡張子>` に
取り込まれ（内容ハッシュで重複排除）、`/notion-images/...` として Vercel で配信される。
外部 URL（例: `static.igem.wiki` の画像を「埋め込み」した場合）はそのまま通す。

同期のたびに、`static.igem.wiki` 以外を指す画像を `content/images-todo.json`
（`[{ "slug", "locale", "src" }]`）に出す。人が `static.igem.wiki` に上げ直すための一覧で、
git には入れない。自動アップロードは行わない。

> ⚠️ これは**プレビュー運用の暫定方式**。iGEM 規定では画像をリポジトリに直接コミットせず
> `static.igem.wiki` を使う必要があるため、本番提出前に自動アップロードへ移行する
> （[Issue #13](https://github.com/jiku0730/iGEM_wiki_keio/issues/13)）。

## 3. ローカルで手動同期

```bash
cd web
cp .env.local.example .env.local   # 値を埋める（NOTION_TOKEN / NOTION_DATABASE_ID）
yarn notion:sync                   # content/ に JSON を生成
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
