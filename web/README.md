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
| `npm run notion:sync` | Notionの原稿を書き出す(#27で`content/`向けに更新予定) |
| `npm run notion:import` | 既存の`wiki/pages/*.html`をNotionへ取り込む(初期移行用) |

## フォント

見出しとナビはMontserrat、本文はNoto Sans JP(どちらもSIL Open Font License)。`public/fonts/`に置き、`public/fonts/fonts.css`の`@font-face`から読む。`Page.tsx`が`<head>`の`<link>`で`fonts.css`を読み、woff2は`fonts.css`からの相対パスで引く。

- `WIKI_FONT_BASE`で`fonts.css`の置き場所を切り替える。未指定なら配信パス配下の`/fonts`(`WIKI_BASE=/keio/`なら`/keio/fonts`)。本番では`WIKI_FONT_BASE=https://static.igem.wiki/teams/<id>/fonts npm run build`とし、`public/fonts/`の中身を同じ場所へ人がアップロードする。
- いまの`public/fonts/`はGoogle Fontsが配るunicode-range付きの分割woff2(Montserratが5つ、Noto Sans JPが124)をそのまま置いたもの。ブラウザは使う文字を含む分割だけを取りに行く。全体は約5.4MBあり、未サブセットの状態。
- サブセット化して1ファイルにするときは、fonttoolsを使う。`content/**/*.json`の文字に、JIS第1水準、ひらがな、カタカナ、記号、ラテン文字を足した文字列を`chars.txt`に作り、次を実行する。

```sh
pip install fonttools brotli
pyftsubset NotoSansJP[wght].ttf --text-file=chars.txt --flavor=woff2 --layout-features='*' --output-file=noto-sans-jp-subset.woff2
```

  できた`woff2`を`public/fonts/`に置き、`fonts.css`の`@font-face`を1つにして、`unicode-range`を外す。

## 配信パス

`WIKI_BASE`で配信パスを切り替える。既定は`/`。GitLab Pagesでは`WIKI_BASE=/keio/ npm run build`とすると、CSS、JS、リンクがすべて`/keio/`から始まる。

## プリレンダーの仕組み

- `src/routes.ts`が`content/<locale>/*.json`を読み、`published`なページの一覧を作る。URLパスが衝突するページがあればエラーにする。
- `scripts/prerender.mjs`が`vite build`のSSRモードで`src/routes.ts`と`src/Page.tsx`を`.vite/ssr/`に束ね、Nodeから読み込む。`.tsx`を直接実行する`tsx`などの依存は増やさない。
- `dist/.vite/manifest.json`からCSSとJSのハッシュ付きファイル名を取り、`Page`に渡す。
- `Page`は`renderToStaticMarkup`でHTMLにして`dist/<path>/index.html`に書く。`islands`が空のページには`<script>`を入れない。
- 最後に、書き出したページ数と`content/`の`published`なJSONの数を突き合わせ、一致しなければ非ゼロで終了する。
- ビルド時にNodeで動く`src/`のコードでは`window`と`document`を参照しない。

## レイアウト

- `src/components/PageShell.tsx`が全ページの枠(Sidebar、本文、Toc、Footer)を作る。見た目の値は`src/styles/tokens.css`、リセットと`@layer`の宣言は`src/styles/global.css`にある。
- 部品のCSSは`*.module.css`で、`@layer components`の中に書く。SSRでしか参照されないため、`src/main.tsx`で値として読み込み、クライアント側のCSSに束ねている。
- 768px未満ではSidebarが上部のバーになり、`<details>`でナビを開閉する。ナビをデスクトップで常に見せるために`::details-content`を使うので、対応していない古いブラウザではナビが閉じたままになる。
- Tocは`lib/toc.ts`が`html`のh2とh3から作り、見出しのないページでは出さない。1280px以上で本文の右に置く。
