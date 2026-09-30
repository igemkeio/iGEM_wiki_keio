# 実装指示書: #27 Notion 同期の出力を JSON に変える

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/27
設計メモ: docs/architecture.md(「原稿の受け渡し形式」「デザイン」「範囲外」)
原稿の形式: content/README.md と web/src/content.ts(#25 で確定。変更しない)
既存の手順書: docs/notion-sync.md

## 目的

`web/scripts/notion-sync.mjs` の出力先を、Jinja 形式の `wiki/pages/*.html` から `content/<locale>/<slug>.json` に変える。`main` の Next.js 版はまだ動いているので、移行中は旧形式も出せるようにする。

## 作業ブランチ

- `origin/feat/25-content-json` から `feat/27-notion-sync-json` を切る。
- PR は `feature/vite-mpa` に向ける。

## 変更範囲

触るファイル

- `web/scripts/notion-sync.mjs`
- `web/scripts/lib/`(新規): 変換部分を関数として切り出す先。`markdown.mjs`(Markdown から HTML、見出し id、Figure カード、Note)、`katex.mjs` など
- `web/scripts/lib/*.test.mjs`(新規): 上の関数の単体テスト。Vitest は #35 で入るので、ここでは Node 組み込みの `node:test` を使い、`node --test scripts/lib/` で走る形にする
- `web/package.json`: 依存に `katex` を足すだけ。scripts に `test:sync`(`node --test scripts/lib/`)を足す。それ以外の行(Next.js の依存、yarn の設定)は触らない。#26 が同じファイルを大きく書き換えるので、差分を最小にして衝突を小さくする
- `web/yarn.lock`: `katex` の追加分だけ更新される
- `docs/notion-sync.md`: DB のプロパティの表に `order` と `subtitle` を足す。出力先を `content/` に書き換える。yarn のコマンド表記はそのまま残す(npm への書き換えは #39 で行う)
- `.gitignore`: `content/images-todo.json` を無視する

触らないファイル

- `content/README.md`、`web/src/`、`wiki/`、CI、`notion-trigger/`

## 実装

### Notion DB のプロパティ

- 既存: `slug`(Title)、`locale`(Select)、`heading`(Rich text)、`lead`(Rich text)、`published`(Checkbox)
- 追加: `order`(Number)、`subtitle`(Rich text)
- 無い場合は省略として扱い、エラーにしない。DB へのプロパティ追加は人が行うので、`docs/notion-sync.md` に手順を書く

### JSON の出力

- `content/<locale>/<slug>.json` に、`content/README.md` のフィールドで書く。`heading` を `title` に写す
- `slug` は小文字英数字とハイフンのみに正規化する(大文字は小文字に、空白とアンダースコアはハイフンに)。正規化で変わった場合はログに出す
- 出力は `JSON.stringify(page, null, 2)` に改行を付ける。キーの順は README の表の順
- DB に無くなったページの JSON は消す(`published: false` になったページも同様)。ただし `content/README.md` は消さない

### Markdown から HTML

- 既存の notion-to-md と marked を使い続ける
- 見出し id: README の規定どおり。h2 と h3 に付ける。文字列を小文字化、空白をハイフン、句読点と記号を除き、Unicode の文字はそのまま残す。重複は `-2`、`-3`
- 数式: Notion の equation ブロック(ブロック数式)とインライン数式を KaTeX で HTML に描画する(`katex.renderToString`、`throwOnError: false`)。KaTeX の CSS を読むのは #29 の範囲
- callout ブロック: `<aside class="note"><p class="note__label">Note</p>...</aside>`。callout のアイコンは捨てる
- 画像とキャプション: Notion の image ブロックにキャプションがあれば `<figure class="figure-card">` の形にする。キャプションの先頭が `Fig. N` の形なら `figure-card__label` に、残りを `figure-card__title` にする。キャプションが無い画像は素の `<img>` のまま
- 上の変換はすべて `web/scripts/lib/` の純粋関数にし、テストを書く

### 画像

- 既存の `localizeImage`(`web/public/notion-images/` に保存)は残す。ただし `static.igem.wiki` の URL はそのまま通す
- 同期の最後に、`static.igem.wiki` 以外の画像 URL を `content/images-todo.json` に一覧で出す(`[{ slug, locale, src }]`)。人が `static.igem.wiki` に上げるための一覧で、自動アップロードは作らない(Issue #13 の範囲)

### 旧形式との並走

- 環境変数 `NOTION_SYNC_LEGACY_HTML=1` のときだけ、従来どおり `wiki/pages/*.html` も出す
- 既定では JSON だけを出す

## 受け入れ条件

- 実際の Notion DB に対して `yarn notion:sync` を走らせ、既存の全ページが `content/<locale>/<slug>.json` として出て、`web/src/content.ts` の `readPage` を通る(`content.check.ts` の形で確認するか、同期スクリプト内で `readPage` 相当の確認をして落ちないことを示す)
- 数式を含むページで KaTeX の HTML が出ている(無ければ、テスト用に Notion に1ブロック足してよい。足したら報告に書く)
- callout と、キャプション付き画像が、README の形の HTML になっている
- `NOTION_SYNC_LEGACY_HTML=1` で `wiki/pages/*.html` も出て、`main` の Next.js ビルドが通る
- `node --test scripts/lib/` が通る
- `cd web && yarn lint` がエラー0

## 環境

- `NOTION_TOKEN` と `NOTION_DATABASE_ID` は `web/.env.local` にある。無ければ実行せず報告する

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(変換関数の切り出し、見出し id、KaTeX、callout と Figure、JSON 出力、旧形式の切り替え、文書、の順が目安)
- コメントは日本語。いまどうなっているかだけを書く
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
