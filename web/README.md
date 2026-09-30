# web

iGEM Keioのwikiを生成するViteとReactのプロジェクト。`content/`の原稿JSONから、ページごとの静的HTMLを`dist/`に書き出す。全体の構成は`docs/architecture.md`を参照。

Nodeは24系(リポジトリ直下の`.node-version`)、パッケージマネージャーはnpm。

Viteは`^7`に固定する。Vite 8はRolldownへの置き換えで、今季は7で固定し、8への移行は別Issueで扱う。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm ci` | 依存を入れる |
| `npm run dev` | `vite build --watch`と`vite preview`を並走させる。`web/src/`と`content/`の保存ごとに再ビルドし、prerenderをやり直す。URLは起動時に表示される |
| `npm run build` | `vite build`のあとに`scripts/prerender.mjs`を実行し、`dist/`に全ページのHTMLを書く |
| `npm run preview` | `dist/`を配信する |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | `dist/`のHTMLとCSSを検査する。`npm run build`の後に実行する |
| `npm run test:check` | `check`の検査関数のテスト(`node:test`) |
| `npm run notion:sync` | Notionの原稿を書き出す(#27で`content/`向けに更新予定) |
| `npm run notion:import` | 既存の`wiki/pages/*.html`をNotionへ取り込む(初期移行用) |

## 配信パス

`WIKI_BASE`で配信パスを切り替える。既定は`/`。GitLab Pagesでは`WIKI_BASE=/keio/ npm run build`とすると、CSS、JS、リンクがすべて`/keio/`から始まる。

## プリレンダーの仕組み

- `src/routes.ts`が`content/<locale>/*.json`を読み、`published`なページの一覧を作る。URLパスが衝突するページがあればエラーにする。
- `scripts/prerender.mjs`が`vite build`のSSRモードで`src/routes.ts`と`src/Page.tsx`を`.vite/ssr/`に束ね、Nodeから読み込む。`.tsx`を直接実行する`tsx`などの依存は増やさない。
- `dist/.vite/manifest.json`からCSSとJSのハッシュ付きファイル名を取り、`Page`に渡す。
- `Page`は`renderToStaticMarkup`でHTMLにして`dist/<path>/index.html`に書く。`islands`が空のページには`<script>`を入れない。
- 最後に、書き出したページ数と`content/`の`published`なJSONの数を突き合わせ、一致しなければ非ゼロで終了する。
- ビルド時にNodeで動く`src/`のコードでは`window`と`document`を参照しない。

## 出力の検査

`npm run check`は`dist/`を走査し、違反を`ファイル: 理由`の1行ずつ出す。1件でもあれば終了コード1。`WIKI_BASE`を読むので、`WIKI_BASE=/keio/ npm run build`で作った`dist/`は`WIKI_BASE=/keio/ npm run check`で検査する。

- ページ数: `content/`の`published`なJSONの数と、`dist/**/index.html`の数が一致する。
- 外部URL: `<link>`、`<script>`、`<img>`、`<source>`、`<video>`、`<iframe>`の`src`と`href`、およびCSSの`url(...)`は、`http://`、`https://`、`//`で始まる場合にホストが`static.igem.wiki`、`video.igem.org`、`igem.org`と`igem.wiki`(サブドメインを含む)のどれかであること。`<a href>`の外部リンクは対象外。
- 内部リンク: `/`で始まる`href`と`src`(`<a>`を含む)は、`base`を除いたパスが`dist/`のファイルか、`index.html`を持つディレクトリを指すこと。`base`の外を指すリンクも違反。`#`だけの`href`と`mailto:`は見ない。
- 構造: 各HTMLに`<title>`と`<h1>`が1つずつあり、`<img>`に`alt`属性がある(空文字は可)。
- `<html lang>`が`en`か`ja`。
- `islands`が空のページに`<script>`がない。

検査するのは`dist/`のHTMLと`dist/assets/`のCSSだけ。`web/public/`由来のディレクトリ(`static/`、`people/`、`notion-images/`)は読まない。`dist/static/bootstrap.min.css`などの外部URLは#34で取り除くまで検査しない。HTMLの解析は正規表現で行い、依存は増やさない。検査の関数は`scripts/lib/check/`にあり、`npm run test:check`でテストする。
