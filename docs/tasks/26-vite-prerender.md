# 実装指示書: #26 web/ を Vite と React で作り直し、全ページの HTML を書き出す

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/26
設計メモ: docs/architecture.md(「全体像」「選定の理由」「ルーティングとプリレンダー」「島」「配信パス」「ツールチェーン」)
原稿の形式: content/README.md と web/src/content.ts(#25 で確定。変更しない)

## 目的

Next.js を外し、Vite と React で `content/` の全ページを `dist/` に静的 HTML として書き出す土台を作る。見た目はこの Issue の範囲外で、最小のレイアウトだけを持つ。

## 作業ブランチ

- `origin/feat/25-content-json` から `feat/26-vite-prerender` を切る(#25 の PR #42 はまだ `feature/vite-mpa` にマージされていない)。
- PR は `feature/vite-mpa` に向ける。#42 がマージされると差分は #26 の分だけになる。

## 変更範囲

触るファイル

- `web/package.json`: Next.js 関連を消し、依存を react、react-dom、vite、@vitejs/plugin-react、typescript、@types/react、@types/react-dom、@types/node にする。`packageManager` の行を消す。scripts は `dev`、`build`、`preview`、`typecheck`、`notion:sync`、`notion:import`(既存の2つは残す)
- `web/package-lock.json`: 新規。`web/yarn.lock`、`web/.yarnrc.yml`(あれば)は消す
- `.node-version`(リポジトリ直下): `24`
- `web/package.json` の `engines.node`: `>=24`
- `web/vite.config.ts`、`web/tsconfig.json`(strict、`content.check.ts` が引き続き対象に入ること)
- `web/index.html`: Vite のエントリ。ブラウザ側 JS の束ね先として最小限
- `web/src/routes.ts`、`web/src/Page.tsx`、`web/src/main.tsx`(ブラウザ側のエントリ。当面は空に近い)
- `web/scripts/prerender.mjs`
- `web/.gitignore`: `dist/`、`.vite/`
- `web/README.md`: コマンドの説明を書き換える

消すファイル

- `web/next.config.mjs`、`web/next-env.d.ts`、`web/postcss.config.mjs`、`web/eslint.config.mjs`、`web/.prettierrc.json`(Lint と Format は #40 で Ultracite に揃えるので、ここでは消すだけ)
- `web/src/app/` 全体、`web/src/lib/wiki.ts`、`web/src/lib/toc.ts`、`web/src/components/` 全体(#28 以降で新しく作る。`MemberList` と `members.json` は #31 で使うので、`web/src/data/members.json` だけ残す)
- `web/out/`(ビルド成果物。gitignore 済みなら何もしない)

触らないファイル

- `content/`、`web/src/content.ts`、`web/src/content.check.ts`
- `web/scripts/notion-sync.mjs`、`web/scripts/notion-import.mjs`(#27 が触る。依存の `@notionhq/client`、`notion-to-md`、`marked`、`turndown`、`@tryfabric/martian` は package.json に残す)
- `wiki/`、`static/`、`vercel.json`、`.gitlab-ci.yml`、`.github/`、`notion-trigger/`、`docs/`

## 実装

### routes.ts

- `content/<locale>/*.json` を読み、`readPage(json, path)` を通して `WikiPage[]` を作る。
- `published: false` のページは除く。
- URL は `locale === "en"` なら `/<slug>/`、`ja` なら `/ja/<slug>/`。`slug === "home"` は `/` と `/ja/`。
- 並びは `order` 昇順、同値は `slug` の辞書順。
- `base`(後述)を付けた `href` を作るヘルパー `withBase(path)` をここか `web/src/base.ts` に置く。

### Page.tsx

- 最小のレイアウト。`<html lang>`、`<head>`(`<meta charset>`、`<meta viewport>`、`<title>{title} | iGEM Keio 2026</title>`、CSS の `<link>`)、`<body>` に `<h1>{title}</h1>`、`subtitle`、`lead`(`<p>` で包む)、`html`(`dangerouslySetInnerHTML`)。
- `islands` が空でなければ、ブラウザ側 JS の `<script type="module">` を差し込む。空なら差し込まない。島の器を出す仕組み自体は #31 の範囲なので、ここでは script の差し込みの有無だけを実装する。
- ビルド時に Node で実行されるので、`window` と `document` を参照しない。

### prerender.mjs

- `vite build` の後に実行する。`dist/.vite/manifest.json`(`build.manifest: true`)から CSS と JS のハッシュ付きファイル名を取り、`Page` に渡す。
- `routes.ts` のページを回し、`renderToStaticMarkup(<Page ... />)` の先頭に `<!doctype html>` を付けて `dist/<path>/index.html` に書く。
- `.tsx` を Node から読むために、`vite build --ssr` で `prerender` 用のエントリを別に束ねるか、`tsx` パッケージで直接実行するか、どちらかにする。依存を増やさない前者を勧める(`vite.config.ts` で SSR 用の設定を分ける)。決めた方法を `web/README.md` に書く。
- 出力したページ数と、`content/` の published なページ数を最後に表示する。

### base

- `vite.config.ts` の `base` は環境変数 `WIKI_BASE`(既定 `/`)。`WIKI_BASE=/keio/` のとき、CSS、JS、`<a href>` すべてが `/keio/` から始まる。
- `prerender.mjs` も同じ値を読み、`withBase` に渡す。

### scripts

- `dev`: `vite build --watch` と `vite preview` の並走。依存を増やさず、`node scripts/dev.mjs` で2つを `child_process` から起動する形でよい。`--watch` のビルド完了ごとに `prerender.mjs` を再実行する。
- `build`: `vite build && node scripts/prerender.mjs`
- `preview`: `vite preview`
- `typecheck`: `tsc --noEmit`

## 受け入れ条件

- `npm ci && npm run build` で、`content/` の published な全ページ分の `index.html` が `dist/` に出る(いまは en と ja の home の2つ)
- `WIKI_BASE=/keio/ npm run build` で、`dist/` 内の HTML のリンクとアセットのパスが `/keio/` から始まる
- `npm run typecheck` がエラー0(`content.check.ts` を含む)
- `npm run dev` で、`content/en/home.json` を書き換えて保存すると再ビルドされ、`preview` の URL で反映が見える
- `dist/index.html` に React の `<script>` が含まれない(`islands` が空のため)
- `web/src/` のビルド時コードに `window`、`document` の参照がない(`grep` で確認)

## 規約

- コミットは `<prefix>: 日本語一行。`。削除は `rm:`、新規は `add:`、置き換えは `refactor:` など。1コミット1論理単位(Next.js の削除、Vite の導入、routes と Page、prerender、dev スクリプト、README、の6つ程度)
- コメントは日本語。いまどうなっているかだけを書き、経緯は書かない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
