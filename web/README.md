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

見出しとナビはMontserrat、本文はNoto Sans JP(どちらもSIL Open Font License)。`public/fonts/`にサブセット済みのwoff2を置き、`src/styles/global.css`の`@font-face`から読む。

- `public/fonts/`の中身はMontserratが可変の1本(ラテン文字のみ)、Noto Sans JPがweight 400と700の静的2本。合計は約1.2MB。
- Noto Sans JPに含める文字は、JIS第1水準の漢字、ひらがな、カタカナ、全角と半角の記号、ラテン文字(ASCIIとラテン1)、`content/**/*.json`に出てくる文字。原稿に新しい漢字が増えたら再生成する。
- 再生成は`npm run fonts:subset`。元のフォントはgoogle/fontsのリポジトリ(`ofl/notosansjp`と`ofl/montserrat`の可変TTF)で、`fonts-src/`に無ければスクリプトがダウンロードする。`fonts-src/`はgit管理外。手元のTTFを使うときは`fonts-src/NotoSansJP.ttf`と`fonts-src/Montserrat.ttf`として置く。サブセット化には`subset-font`(devDependency)を使う。
- `global.css`の`url()`の先頭は目印の`__WIKI_FONT_BASE__`で、`vite.config.ts`のプラグインが環境変数`WIKI_FONT_BASE`に置き換える。未指定なら配信パスを付けた`/fonts`(`WIKI_BASE=/keio/`なら`/keio/fonts`)。末尾のスラッシュは落とす。
- 本番では`WIKI_FONT_BASE=https://static.igem.wiki/teams/<id>/fonts npm run build`とし、`public/fonts/`の中身を同じ場所へ人がアップロードする。

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

- `src/components/PageShell.tsx`が全ページ共通の枠(Sidebar、children、Footer)を作る。`ArticlePage.tsx`がh1、subtitle、lead、本文と目次を描き、`Page.tsx`が`ArticlePage`を`PageShell`の子に入れる。本文を包む要素にはハッシュの付かないクラス`prose`を付けてあり、本文の幅は#29で子要素に当てる。
- 見た目の値は`src/styles/tokens.css`、リセットと`@layer`の宣言は`src/styles/global.css`にある。
- 部品のCSSは`*.module.css`で、`@layer components`の中に書く。SSRでしか参照されないため、`vite.config.ts`の`keep-css-modules`がtree-shakeで捨てられないようにし、`src/main.tsx`の`import.meta.glob`でクライアント側のCSSに束ねる。`global.css`を先に読むのは、`@layer`の宣言を最初に置くため。
- 768px未満ではSidebarが上部のバーになり、`<details>`でナビを開閉する。デスクトップでナビを常に見せるために`::details-content`を使い、非対応のブラウザではデスクトップでもトグルを出して開閉式にする。
- Tocは`lib/toc.ts`が`html`のh2とh3から作り、見出しのないページでは出さない。1440px以上で本文の右に置く。
- Sidebarには`view-transition-name: sidebar`が付き、ページ遷移のアニメーションは`prefers-reduced-motion: no-preference`のときだけ有効。

## 3Dモデル

`model-viewer`島が、`content/`の`models`フィールドの先頭1件を`<model-viewer>`(Googleのweb component、npmの`@google/model-viewer`)で表示する。フィールドの形は`content/README.md`を参照。

- 島の中身は`src/components/ModelViewer.tsx`。WebGLが使えると分かってから`@google/model-viewer`を動的importし、別チャンクとして配る。WebGLが無い環境では読み込まず、`poster`の画像だけを出す。`<model-viewer>`は`loading="lazy"`なので、.glbは画面に入るまで取得されない。
- Blenderからglb(glTF Binary)で書き出し、Draco圧縮を有効にする。1モデル2〜5MB以下を目安にする。テクスチャは2048px以下に縮める。
- Draco圧縮したglbは、デコーダーを実行時に`gstatic.com`から取りに行く。iGEMの規定で外部の読み込みができないので、圧縮を使うモデルを載せる前に、デコーダーを`static.igem.wiki`に置く対応が要る(別Issue)。
- .glbとposterは画像と同じ扱いで`static.igem.wiki`に置く。リポジトリには入れない。`tools.igem.org`が.glbを受け付けるかは未確認で、人が確かめる。
- posterはモデルを正面斜めから撮ったPNGで、100KB以下にする。
- 暫定のサンプルとして`public/models/sample.glb`(約360KB)と`sample.png`を置いてある。`content/en/model-sample.json`が使う(`published: false`)。確認するときは`published`をtrueにしてビルドする。本番の配信前に消す。
- サンプルのglbはKhronosのglTF-Sample-AssetsにあるCesiumMilkTruck(c) 2017 Cesium、CC BY 4.0。出典は`https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck`。
- `models`の`src`と`poster`にはbaseを付けない。`WIKI_BASE`で配信パスを変える環境で`/models/...`のような相対パスを使うときは、その分を含めて書く。
