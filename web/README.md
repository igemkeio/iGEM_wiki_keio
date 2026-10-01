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
| `npm test` | Vitestを1回流す |
| `npm run test:watch` | Vitestをwatchモードで流す |
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

## テスト

- Vitestは`src/**/*.test.{ts,tsx}`を対象にする。環境はhappy-domで、`src/test/setup.ts`でjest-domのmatcherを登録している。
- `vitest.config.ts`は`vite.config.ts`を`mergeConfig`で継承する。`import.meta.glob`などのpluginの設定は引き継ぐが、Vitestは`base`を`/`に固定するので、テストでは`WIKI_BASE`を指定しても常に`/`になる。
- `routes.ts`のテストは、`import.meta.glob`の結果を受け取る`buildRoutes`に入力を渡して書く。
- `Page.test.tsx`はプリレンダーのHTMLをスナップショットで固定する。スナップショットは`src/__snapshots__/`に置く。
- `Page`やマークアップを意図して変えたときは、差分を確認してからスナップショットを更新する。

```sh
npx vitest run -u
```

- `scripts/lib/*.test.mjs`は`node:test`で書かれており、Vitestの対象外。
