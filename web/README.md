# web

iGEM Keio の wiki を生成する Vite と React のプロジェクト。`content/` の原稿 JSON から、ページごとの静的 HTML を `dist/` に書き出す。全体の構成は `docs/architecture.md` を参照。

Node は 24 系(リポジトリ直下の `.node-version`)、パッケージマネージャーは npm。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm ci` | 依存を入れる |
| `npm run dev` | `vite build --watch` と `vite preview` を並走させる。`web/src/` と `content/` の保存ごとに再ビルドし、prerender をやり直す。URL は起動時に表示される |
| `npm run build` | `vite build` のあとに `scripts/prerender.mjs` を実行し、`dist/` に全ページの HTML を書く |
| `npm run preview` | `dist/` を配信する |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run notion:sync` | Notion の原稿を書き出す(#27 で content/ 向けに更新予定) |
| `npm run notion:import` | 既存の wiki/pages/*.html を Notion へ取り込む(初期移行用) |

## 配信パス

`WIKI_BASE` で配信パスを切り替える。既定は `/`。GitLab Pages では `WIKI_BASE=/keio/ npm run build` とすると、CSS、JS、リンクがすべて `/keio/` から始まる。

## プリレンダーの仕組み

- `src/routes.ts` が `content/<locale>/*.json` を読み、`published` なページの一覧を作る。
- `scripts/prerender.mjs` が `vite build` の SSR モードで `src/routes.ts` と `src/Page.tsx` を `.vite/ssr/` に束ね、Node から読み込む。`.tsx` を直接実行する `tsx` などの依存は増やさない。
- `dist/.vite/manifest.json` から CSS と JS のハッシュ付きファイル名を取り、`Page` に渡す。
- `Page` は `renderToStaticMarkup` で HTML にして `dist/<path>/index.html` に書く。`islands` が空のページには `<script>` を入れない。
- ビルド時に Node で動く `src/` のコードでは `window` と `document` を参照しない。
