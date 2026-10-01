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
| `npm test` | Vitestを1回流す |
| `npm run test:watch` | Vitestをwatchモードで流す |
| `npm run notion:sync` | Notionの原稿を書き出す(#27で`content/`向けに更新予定) |
| `npm run notion:import` | 既存の`wiki/pages/*.html`をNotionへ取り込む(初期移行用) |

## フォント

見出しとナビはMontserrat、本文はNoto Sans JP(どちらもSIL Open Font License)。`public/fonts/`にサブセット済みのwoff2を置き、`src/styles/global.css`の`@font-face`から読む。

- `public/fonts/`の中身はMontserratが可変の1本(ラテン文字のみ)、Noto Sans JPがweight 400と700の静的2本。合計は約1.2MB。
- Noto Sans JPに含める文字は、JIS第1水準の漢字、ひらがな、カタカナ、全角と半角の記号、ラテン文字(ASCIIとラテン1)、`content/**/*.json`に出てくる文字。原稿に新しい漢字が増えたら再生成する。
- 再生成は`npm run fonts:subset`。元のフォントはgoogle/fontsのリポジトリ(`ofl/notosansjp`と`ofl/montserrat`の可変TTF)で、`fonts-src/`に無ければスクリプトがダウンロードする。`fonts-src/`はgit管理外。手元のTTFを使うときは`fonts-src/NotoSansJP.ttf`と`fonts-src/Montserrat.ttf`として置く。サブセット化には`subset-font`(devDependency)を使う。
- `global.css`の`url()`の先頭は目印の`__WIKI_FONT_BASE__`で、`vite.config.ts`のプラグイン(`asset-base`)が環境変数`WIKI_FONT_BASE`に置き換える。未指定なら配信パスを付けた`/fonts`(`WIKI_BASE=/keio/`なら`/keio/fonts`)。末尾のスラッシュは落とす。
- 本番では`WIKI_FONT_BASE=https://static.igem.wiki/teams/<id>/fonts npm run build`とし、`public/fonts/`の中身を同じ場所へ人がアップロードする。

## 画像

- `public/images/`にロゴなどの画像を置く。Homeのロゴは`public/images/one-direction.png`。Figma上でもラスター画像なのでSVGは無い。リポジトリに置くのは暫定で、本番は`WIKI_IMAGE_BASE`で`static.igem.wiki`に向ける。
- ソースの画像URLの先頭は目印の`__WIKI_IMAGE_BASE__`で、`vite.config.ts`のプラグイン(フォントの目印と同じもの)が環境変数`WIKI_IMAGE_BASE`に置き換える。未指定なら配信パスを付けた`/images`。末尾のスラッシュは落とす。
- 本番では`WIKI_IMAGE_BASE=https://static.igem.wiki/teams/<id>/images npm run build`とし、`public/images/`の中身を同じ場所へ人がアップロードする。

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
- `slug`が`home`のページは`Page.tsx`が`HomePage.tsx`を使う。ヒーロー(ロゴ、曲線と円の装飾、キャッチ、紹介)とContentsのカードを持ち、`lead`がキャッチ(`<b>`は青)、`subtitle`と`html`が右下の紹介になる。カードは現在の言語のhome以外のページを`order`順に並べる。装飾のアニメーションはCSSだけで、`prefers-reduced-motion: reduce`では止まる。
- 見た目の値は`src/styles/tokens.css`、リセットと`@layer`の宣言は`src/styles/global.css`にある。
- 部品のCSSは`*.module.css`で、`@layer components`の中に書く。SSRでしか参照されないため、`vite.config.ts`の`keep-css-modules`がtree-shakeで捨てられないようにし、`src/main.tsx`の`import.meta.glob`でクライアント側のCSSに束ねる。`global.css`を先に読むのは、`@layer`の宣言を最初に置くため。
- 768px未満ではSidebarが上部のバーになり、`<details>`でナビを開閉する。デスクトップでナビを常に見せるために`::details-content`を使い、非対応のブラウザではデスクトップでもトグルを出して開閉式にする。
- Tocは`lib/toc.ts`が`html`のh2とh3から作り、見出しのないページでは出さない。1440px以上で本文の右に置く。
- Sidebarには`view-transition-name: sidebar`が付き、ページ遷移のアニメーションは`prefers-reduced-motion: no-preference`のときだけ有効。

## 出力の検査

`npm run check`は`dist/`を走査し、違反を`ファイル: 理由`の1行ずつ出す。1件でもあれば終了コード1。`WIKI_BASE`を読むので、`WIKI_BASE=/keio/ npm run build`で作った`dist/`は`WIKI_BASE=/keio/ npm run check`で検査する。

- ページの対応: `content/`の`published`なJSONから決まるパスの集合と、`dist/**/index.html`の集合が一致する。対応のない`index.html`と、`index.html`のない原稿を、それぞれ違反として出す。`content/`が読めないときと、JSONが壊れているときは、ファイル名付きで終了コード1にする。
- 外部URL: `<a>`と`<area>`の`href`を除くすべてのタグの`src`、`href`、`data`、`poster`、`srcset`、`imagesrcset`(候補ごと)、SVGの`xlink:href`、`<meta>`の`content`と、`style`属性、`<style>`、CSSの`url(...)`と`@import`は、ブラウザと同じ規則でURLを解釈して外部ホストを指す場合に、ホストが`static.igem.wiki`、`video.igem.org`、`igem.org`と`igem.wiki`(サブドメインを含む)のどれかであること。`<a href>`の外部リンクは対象外。
- 内部リンク: `/`で始まる`href`と`src`(`<a>`を含む)は、`base`を除いたパスが`dist/`のファイルか、`index.html`を持つディレクトリを指すこと。`base`の外を指すリンクも違反。`#`だけの`href`と`mailto:`は見ない。
- 構造: 各HTMLに`<title>`(SVGの中は数えない)と`<h1>`が1つずつあり、`<img>`に`alt`属性がある(空文字は可)。
- `<html lang>`が`en`か`ja`。
- `islands`が空のページに`<script>`がない。

検査するのは`dist/`のHTMLと、`dist/assets/`配下のCSSだけ。`web/public/`由来のディレクトリ(`static/`、`people/`、`notion-images/`)のHTMLとCSSは読まない。HTMLの解析は正規表現で行い、依存は増やさない。検査の関数は`scripts/lib/check/`にあり、`npm run test:check`でテストする。
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

## 3Dモデル

`model-viewer`島が、`content/`の`models`フィールドの先頭1件を`<model-viewer>`(Googleのweb component、npmの`@google/model-viewer`)で表示する。フィールドの形は`content/README.md`を参照。

- 島の中身は`src/components/ModelViewer.tsx`。WebGLが使え、島が画面の200px手前まで来てから`@google/model-viewer`を動的importし、別チャンクとして配る。それまでと、WebGLが無い環境では、`poster`の画像だけを出す。`<model-viewer>`は`loading="lazy"`なので、.glbは画面に入るまで取得されない。
- Blenderからglb(glTF Binary)で書き出し、Draco圧縮を有効にする。1モデル2〜5MB以下を目安にする。テクスチャは2048px以下に縮める。
- `ModelViewer`はDracoとKTX2のデコーダーの場所を`/models/decoders/draco/`と`/models/decoders/basis/`(baseを付ける)に向けていて、`gstatic.com`には出ない。デコーダーを`public/models/decoders/`か`static.igem.wiki`に置くまでは、Draco圧縮とKTX2テクスチャを使わない。
- .glbとposterは画像と同じ扱いで`static.igem.wiki`に置く。リポジトリには入れない。`tools.igem.org`が.glbを受け付けるかは未確認で、人が確かめる。
- posterはモデルを正面斜めから撮ったPNGで、100KB以下にする。
- 暫定のサンプルとして`public/models/sample.glb`(約360KB)と`sample.png`を置いてある。`content/en/model-sample.json`が使う(`published: false`)。確認するときは`published`をtrueにしてビルドする。本番の配信前に消す。
- サンプルのglbはKhronosのglTF-Sample-AssetsにあるCesiumMilkTruck(c) 2017 Cesium、CC BY 4.0。出典は`https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck`、ライセンスは`https://creativecommons.org/licenses/by/4.0/`。
- `models`の`src`と`poster`が`/`で始まり`//`で始まらないときは、`ISLANDS`の`props`がビルド時にbaseを付ける。`https://`のURLはそのまま使う。
