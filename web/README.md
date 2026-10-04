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
| `npm run typecheck` | `tsc --noEmit`と`tsc -p e2e` |
| `npm run check:code` | oxlintとoxfmtの検査(Ultracite経由)。修正はしない |
| `npm run fix` | oxfmtで整形し、oxlintで自動修正する |
| `npm run check` | `dist/`のHTMLとCSSを検査する。`npm run build`の後に実行する |
| `npm run test:check` | `check`の検査関数のテスト(`node:test`) |
| `npm test` | Vitestを1回流す |
| `npm run test:watch` | Vitestをwatchモードで流す |
| `npm run test:e2e` | PlaywrightでE2Eとビジュアル回帰を流す(`e2e/README.md`) |
| `npm run test:e2e:ui` | PlaywrightのUIモードで流す |
| `npm run notion:sync` | Notionの原稿を`content/`に書き出す(`docs/notion-sync.md`) |
| `npm run test:sync` | Notion同期の関数のテスト(`node:test`) |
| `npm run fonts:subset` | フォントのサブセットを作り直す |

## 開発

- `npm run dev`で開発サーバーを起動する。開発時も本番と同じ経路(`vite build`、prerender、`vite preview`)で描画するので、見た目は本番と変わらない。
- 原稿を変えるときは`content/`のJSONを直接直すか、`npm run notion:sync`でNotionから書き出す。同期には`web/.env.local`が要り、`.env.local.example`をコピーして値を入れる。
- 変更を終えたら、`npm run check:code`、`npm run typecheck`、変更範囲に対応するテストを流す。コミット時にはlefthookが走る(pre-commitの節)。
- コードの約束は`AGENTS.md`にある。

## ビルドと配信

### 配信パス

`WIKI_BASE`で配信パスを切り替える。既定は`/`。GitLab Pagesでは`WIKI_BASE=/keio/ npm run build`とすると、CSS、JS、リンクがすべて`/keio/`から始まる。

### CIと配信

| 場所 | 設定 | 内容 |
| --- | --- | --- |
| GitHub Actions | `.github/workflows/ci.yml` | PRと`feature/vite-mpa`、`main`へのpushで、`lint`、`typecheck`、`test`、`test-scripts`、`build-check`を並列に流し、そのあと`e2e`を流す。`ci-passed`が全ジョブの結果を集約する。`build-check`は`WIKI_BASE=/`と`WIKI_BASE=/keio/`の2回、`npm run build && npm run check`を流す |
| GitLab Pages | `.gitlab-ci.yml` | 既定ブランチだけで`node:24`の上で`web/`をビルドし、`npm run check`のあと`dist/`を`public/`に移す |
| Vercel | `vercel.json` | PRのプレビュー。Root Directoryが`web`なので、そこでビルドと`npm run check`を流し、`dist`を配信する |

- `main`の必須チェックは`ci-passed`だけにする。ジョブを足すときは、`ci.yml`の`ci-passed`の`needs`に加える。
- GitLabのキャッシュはnpmのキャッシュ`web/.npm/`(`npm ci --cache .npm --prefer-offline`)で、キーは`web/package-lock.json`のハッシュ。
- GitLabでは`WIKI_BASE=/$CI_PROJECT_NAME/`としている。前提は、iGEMのwikiが`https://2026.igem.wiki/<team>/`で配信され、GitLabのプロジェクト名(URLの末尾)が`<team>`と一致していること。違っていたら`.gitlab-ci.yml`の`WIKI_BASE`の2か所(buildとcheck)を実際の配信パスに直す。
- `WIKI_FONT_BASE`と`WIKI_IMAGE_BASE`は、`static.igem.wiki`のURLが決まるまで未指定にしてある(baseを付けた`/fonts`と`/images`になる)。決まったら`.gitlab-ci.yml`のbuildに足す。
- Vercelは、プロジェクト設定のRoot Directoryが`web`であることを前提にしている(`vercel.json`はリポジトリ直下に置いたまま読まれる)。コマンドは`web`の中で実行されるので`cd web`は付けず、`outputDirectory`は`dist`にしてある。Root Directoryをリポジトリ直下に変えるときは、`cd web`を付け、`outputDirectory`を`web/dist`にする。
- VercelのプロジェクトのNode.js Versionは24.xを選ぶ。
- GitLabのURLが決まったら確認すること: プロジェクト名と`WIKI_BASE`が一致していること、GitLabのPagesの設定(公開範囲とURL)、`pages`ジョブが既定ブランチで緑になること、公開されたページのCSSとリンクが404にならないこと。

### パレットの切り替え

デザインの比較用に、差し色の3パターンを同じサイトで切り替えられる。本番には出さず、Vercelのプレビューだけに出る。

- トークン: `src/styles/tokens.css`の`:root`が既定。`:root[data-palette="a"]`、`"b"`、`"c"`が`--color-accent-orange`、`--color-accent-blue`、`--color-note-dot`を上書きする。背景、文字、`--color-curve`は共通。
- 環境変数: `WIKI_PALETTE_SWITCHER=1`でビルドすると、全ページの`<head>`に`<script data-palette-switcher>`が1本入る。中身は`src/palette-switcher.ts`を`?raw`で読んだ文字列。未指定なら出さない。
- Vercel: `vercel.json`の`buildCommand`が、`VERCEL_ENV`が`production`以外のときだけ`WIKI_PALETTE_SWITCHER=1`を付ける。
- 見方: プレビューの右下に既定、a、b、cのボタンが出る。選択は`localStorage`の`wiki:palette`に残り、ページを移っても保たれる。`?palette=b`のクエリでも切り替わり、`?palette=default`で既定に戻る。ローカルでは`WIKI_PALETTE_SWITCHER=1 npm run build && npm run preview`で確認する。
- JSが無い環境では既定の色で表示される。

### 出力の検査

`npm run check`は`dist/`を走査し、違反を`ファイル: 理由`の1行ずつ出す。1件でもあれば終了コード1。`WIKI_BASE`を読むので、`WIKI_BASE=/keio/ npm run build`で作った`dist/`は`WIKI_BASE=/keio/ npm run check`で検査する。

- ページの対応: `content/`の`published`なJSONから決まるパスの集合と、`dist/**/index.html`の集合が一致する。対応のない`index.html`と、`index.html`のない原稿を、それぞれ違反として出す。`content/`が読めないときと、JSONが壊れているときは、ファイル名付きで終了コード1にする。
- 外部URL: `<a>`と`<area>`の`href`を除くすべてのタグの`src`、`href`、`data`、`poster`、`srcset`、`imagesrcset`(候補ごと)、SVGの`xlink:href`、`<meta>`の`content`と、`style`属性、`<style>`、CSSの`url(...)`と`@import`は、ブラウザと同じ規則でURLを解釈して外部ホストを指す場合に、ホストが`static.igem.wiki`、`video.igem.org`、`igem.org`と`igem.wiki`(サブドメインを含む)のどれかであること。`<a href>`の外部リンクは対象外。
- 内部リンク: `/`で始まる`href`と`src`(`<a>`を含む)は、`base`を除いたパスが`dist/`のファイルか、`index.html`を持つディレクトリを指すこと。`base`の外を指すリンクも違反。`#`だけの`href`と`mailto:`は見ない。
- 構造: 各HTMLに`<title>`(SVGの中は数えない)と`<h1>`が1つずつあり、`<img>`に`alt`属性がある(空文字は可)。
- `<html lang>`が`en`か`ja`。
- `islands`が空のページに`<script>`がない。ただし`data-palette-switcher`属性を持ち、`src`を持たないインラインのscriptは許す。

検査するのは`dist/`のHTMLと、`dist/assets/`配下のCSSだけ。`web/public/`由来のファイル(`fonts/`、`images/`、`models/`、`notion-images/`)は読まない。HTMLの解析は正規表現で行い、依存は増やさない。検査の関数は`scripts/lib/check/`にあり、`npm run test:check`でテストする。

## テスト

### Vitest

- Vitestは`src/**/*.test.{ts,tsx}`を対象にする。環境はhappy-domで、`src/test/setup.ts`でjest-domのmatcherを登録している。
- `vitest.config.ts`は`vite.config.ts`を`mergeConfig`で継承する。`import.meta.glob`などのpluginの設定は引き継ぐが、Vitestは`base`を`/`に固定するので、テストでは`WIKI_BASE`を指定しても常に`/`になる。
- `routes.ts`のテストは、`import.meta.glob`の結果を受け取る`buildRoutes`に入力を渡して書く。
- `Page.test.tsx`はプリレンダーのHTMLをスナップショットで固定する。スナップショットは`src/__snapshots__/`に置く。
- `Page`やマークアップを意図して変えたときは、差分を確認してからスナップショットを更新する。

```sh
npx vitest run -u
```

- `scripts/lib/*.test.mjs`(`npm run test:sync`)と`scripts/lib/check/*.test.mjs`(`npm run test:check`)は`node:test`で書かれており、Vitestの対象外。

### E2E

`e2e/`にPlaywrightのE2Eとビジュアル回帰がある。初回は`npx playwright install chromium`でブラウザを入れ、`npm run test:e2e`で流す。CIの`e2e`ジョブも同じコマンドを流す。`PRERENDER_ALL=1`で`published: false`のE2E用ページも含めてビルドしてから配信するので、実行後の`dist/`は`npm run check`に通らない。`check`の前に`npm run build`をやり直す。変更箇所とテストの対応、基準画像の扱いは`e2e/README.md`を参照。Vitestの対象は`src/`だけなので、`e2e/`は拾われない。

## Lint

### LintとFormat

UltraciteのプリセットでoxlintとoxfmtをCSSとJSONを含めて掛ける。設定は`oxlint.config.ts`と`oxfmt.config.ts`で、どちらもUltraciteのプリセットを継承する。

- `npm run check:code`が検査で、エラー0がCIの`lint`ジョブの条件。`npm run fix`が自動修正。
- oxfmtの対象は`.ts`、`.tsx`、`.mjs`、`.css`、`.json`、`.md`。`src/__snapshots__/`、`e2e/**/*-snapshots/`、`public/`、`dist/`は両方から除外する。
- oxlintはcore、react、vitestのプリセットを使う。vitestのルールは`src/**/*.test.{ts,tsx}`だけに掛ける(`scripts/`は`node:test`、`e2e/`はPlaywrightのため)。
- ルールは緩めずにコードを直す。理由があって守れないものだけ、行の直前に`// oxlint-disable-next-line <rule> -- <理由>`と書く。プロジェクト全体で止めているルールと理由は`oxlint.config.ts`のコメントにある。

### pre-commit

リポジトリ直下の`lefthook.yml`が、コミット時にステージした`web/`配下のファイルへ次を直列に流し、直したファイルをステージし直す。

1. `oxlint --fix`(`.ts`、`.tsx`、`.mjs`)
2. `oxfmt --write`(`.ts`、`.tsx`、`.mjs`、`.css`、`.json`、`.md`)
3. `npm run typecheck`(`.ts`か`.tsx`が含まれるときだけ)

`npm ci`では、lefthookのpostinstallと`prepare`の両方が`lefthook install`を試みてフックを入れる。直せないlintのエラーや型エラーがあるとコミットは止まる。

`core.hooksPath`をグローバルに設定している環境では、どちらの`lefthook install`も拒否される(`--force`はグローバルのフックを上書きするので使わない)。その場合は、リポジトリの`.git/hooks`へ入れる。

```sh
GIT_CONFIG_GLOBAL=/dev/null npx lefthook install
```

グローバルのフックがリポジトリの`.git/hooks/pre-commit`を呼ぶ作りなら、gitleaksなどのグローバルの検査とlefthookの両方が走る。worktreeでは、グローバルのフックが`git rev-parse --git-common-dir`のhooksを呼ぶ作りでないとlefthookが走らない。

## 仕組み

### プリレンダー

- `src/routes.ts`が`content/<locale>/*.json`を読み、`published`なページの一覧を作る。URLパスが衝突するページがあればエラーにする。
- `scripts/prerender.mjs`が`vite build`のSSRモードで`src/routes.ts`と`src/Page.tsx`を`.vite/ssr/`に束ね、Nodeから読み込む。`.tsx`を直接実行する`tsx`などの依存は増やさない。
- `dist/.vite/manifest.json`からCSSとJSのハッシュ付きファイル名を取り、`Page`に渡す。
- `Page`は`renderToStaticMarkup`でHTMLにして`dist/<path>/index.html`に書く。`islands`が空のページには`<script>`を入れない。
- 最後に、書き出したページ数と`content/`の`published`なJSONの数を突き合わせ、一致しなければ非ゼロで終了する。
- ビルド時にNodeで動く`src/`のコードでは`window`と`document`を参照しない。

### レイアウト

- `src/components/PageShell.tsx`が全ページ共通の枠(Sidebar、children、Footer)を作る。`ArticlePage.tsx`がh1、subtitle、lead、本文と目次を描き、`Page.tsx`が`ArticlePage`を`PageShell`の子に入れる。本文を包む要素にはハッシュの付かないクラス`prose`を付けてあり、`prose.css`がその子要素にスタイルを当てる。
- 本文のスタイルは`src/styles/prose.css`にあり、KaTeXのCSSは`global.css`から`@layer prose`に読む。Figureカードの2カラムは`.prose`の幅(コンテナクエリ)が720px以上のときで、目次のある幅では本文列が約848pxになり、Figmaの1088pxには届かない。Figmaでは図版の下にあるキャプション(`figure-card__label`)は、同期側のHTMLの形を変えないため右カラムの先頭に置く。
- `slug`が`home`のページは`Page.tsx`が`HomePage.tsx`を使う。ヒーロー(ロゴ、曲線と円の装飾、キャッチ、紹介)とContentsのカードを持ち、`lead`がキャッチ(`<b>`は青)、`subtitle`と`html`が右下の紹介になる。カードは現在の言語のhome以外のページを`order`順に並べる。装飾のアニメーションはCSSだけで、`prefers-reduced-motion: reduce`では止まる。
- 見た目の値は`src/styles/tokens.css`、リセットと`@layer`の宣言は`src/styles/global.css`にある。
- 部品のCSSは`*.module.css`で、`@layer components`の中に書く。SSRでしか参照されないため、`vite.config.ts`の`keep-css-modules`がtree-shakeで捨てられないようにし、`src/main.tsx`の`import.meta.glob`でクライアント側のCSSに束ねる。`global.css`を先に読むのは、`@layer`の宣言を最初に置くため。
- 768px未満ではSidebarが上部のバーになり、`<details>`でナビを開閉する。デスクトップでナビを常に見せるために`::details-content`を使い、非対応のブラウザではデスクトップでもトグルを出して開閉式にする。
- Tocは`lib/toc.ts`が`html`のh2とh3から作り、見出しのないページでは出さない。1440px以上で本文の右に置く。
- Sidebarには`view-transition-name: sidebar`が付き、ページ遷移のアニメーションは`prefers-reduced-motion: no-preference`のときだけ有効。

### 島

対話が必要な部品だけをブラウザで動かす。ビルド時は`<div data-island="..." data-props="...">`という器だけを出し、`src/client/islands.tsx`が器を見つけて`createRoot`で起動する。島のあるページにだけ`<script>`が入る。

- 島の名前と部品の対応は`src/client/islands.tsx`、差し込み位置とpropsは`src/islands.ts`の`ISLANDS`にある。島は`member-list`、`model-viewer`、`attribution-form`。
- 原稿JSONの`islands`に挙げた島だけが、そのページに読み込まれる。Notion同期が出すページは、`scripts/lib/page.mjs`の`ISLANDS_BY_SLUG`で決まる。
- 足し方は`AGENTS.md`のコードの約束にある。

### 永続化と共有ストア

MPAではページを移るとJSのメモリが消えるため、ページをまたぐ状態はブラウザの保存領域に置く。コードは`src/client/`にあり、ブラウザでしか動かない。

| 置き場所 | 用途 | キー |
| --- | --- | --- |
| `localStorage` | ブラウザに残したいもの | `wiki:locale`(最後に選んだ言語。値はJSONで`"ja"`のように保存する) |
| `sessionStorage` | タブを閉じるまでのもの | まだ無い |

- `storage.ts`の`readStorage`と`writeStorage`が保存領域を包む。値はJSONで保存する。保存領域が例外を投げる環境(private modeや無効化)では、読みは`undefined`、書きは何もしない。壊れたJSONも`undefined`になる。
- `usePersistedState(key, initial, kind = "local")`は`useState`と同じ戻り値で、変更のたびに保存する。保存が無い、読めない、壊れているときは`initial`になる。同じ`kind`と`key`を使う島は同じ値を見る。保存された値の型は検証しないので、使う側で形を確かめたいときは`initial`と同じ型だけを保存する。
- `store.ts`の`createStore(initial)`は`get`、`set`、`subscribe`を返すモジュールスコープのストアで、`useStore(store)`が`useSyncExternalStore`で購読する。保存が要らない状態を島の間で共有するときに使う。状態管理ライブラリは入れない。
- `locale.ts`の`rememberLocaleOnClick()`が、言語切り替えリンク(`a[hreflang]`)のクリックを`document`で受けて、移る先の言語を`wiki:locale`に保存する。島の中に描画されたリンクも拾う。保存した言語への自動遷移はしない。Sidebarはビルド時のコードでJSを持たないため、クリックの登録は`main.tsx`から行う。
- `rememberLocale`は保存領域に直接書くので、同じページで`usePersistedState("wiki:locale")`を使う島があっても、そのメモリ上の値は更新されない。
- 制約として、島のないページにはJSが配信されないので、言語の保存は島のあるページでしか動かない。全ページで保存したくなったら、数行の素のJSを`public/`に置く別Issueにする。

### 3Dモデル

`model-viewer`島が、`content/`の`models`フィールドの先頭1件を`<model-viewer>`(Googleのweb component、npmの`@google/model-viewer`)で表示する。フィールドの形は`content/README.md`を参照。

- 島の中身は`src/components/ModelViewer.tsx`。WebGLが使え、島が画面の200px手前まで来てから`@google/model-viewer`を動的importし、別チャンクとして配る。それまでと、WebGLが無い環境では、`poster`の画像だけを出す。`<model-viewer>`は`loading="lazy"`なので、.glbは画面に入るまで取得されない。
- Blenderからglb(glTF Binary)で書き出す。1モデル2〜5MB以下を目安にする。テクスチャは2048px以下に縮める。
- `ModelViewer`はDracoとKTX2のデコーダーの場所を`/models/decoders/draco/`と`/models/decoders/basis/`(baseを付ける)に向けていて、`gstatic.com`には出ない。デコーダーを`public/models/decoders/`に置くまでは、Draco圧縮とKTX2テクスチャを使わない。
- .glbとposterは画像と同じ扱いで`static.igem.wiki`に置く。リポジトリには入れない。`tools.igem.org`が.glbを受け付けるかは未確認で、人が確かめる。
- posterはモデルを正面斜めから撮ったPNGで、100KB以下にする。
- 暫定のサンプルとして`public/models/sample.glb`(約360KB)と`sample.png`を置いてある。`content/en/model-sample.json`が使う(`published: false`)。確認するときは`published`をtrueにしてビルドする。本番の配信前に消す。
- サンプルのglbはKhronosのglTF-Sample-AssetsにあるCesiumMilkTruck(c) 2017 Cesium、CC BY 4.0。出典は`https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMilkTruck`、ライセンスは`https://creativecommons.org/licenses/by/4.0/`。
- `models`の`src`と`poster`が`/`で始まり`//`で始まらないときは、`ISLANDS`の`props`がビルド時にbaseを付ける。`https://`のURLはそのまま使う。

### フォント

見出しとナビはMontserrat、本文はNoto Sans JP(どちらもSIL Open Font License)。`public/fonts/`にサブセット済みのwoff2を置き、`src/styles/global.css`の`@font-face`から読む。

- `public/fonts/`の中身はMontserratが可変の1本(ラテン文字のみ)、Noto Sans JPがweight 400と700の静的2本。合計は約1.2MB。
- Noto Sans JPに含める文字は、JIS第1水準の漢字、ひらがな、カタカナ、全角と半角の記号、ラテン文字(ASCIIとラテン1)、`content/**/*.json`に出てくる文字。原稿に新しい漢字が増えたら再生成する。
- 再生成は`npm run fonts:subset`。元のフォントはgoogle/fontsのリポジトリ(`ofl/notosansjp`と`ofl/montserrat`の可変TTF)で、`fonts-src/`に無ければスクリプトがダウンロードする。`fonts-src/`はgit管理外。手元のTTFを使うときは`fonts-src/NotoSansJP.ttf`と`fonts-src/Montserrat.ttf`として置く。サブセット化には`subset-font`(devDependency)を使う。
- `global.css`の`url()`の先頭は目印の`__WIKI_FONT_BASE__`で、`vite.config.ts`のプラグイン(`asset-base`)が環境変数`WIKI_FONT_BASE`に置き換える。未指定なら配信パスを付けた`/fonts`(`WIKI_BASE=/keio/`なら`/keio/fonts`)。末尾のスラッシュは落とす。
- 本番では`WIKI_FONT_BASE=https://static.igem.wiki/teams/<id>/fonts npm run build`とし、`public/fonts/`の中身を同じ場所へ人がアップロードする。

### 画像

- `public/images/`にロゴなどの画像を置く。Homeのロゴは`public/images/one-direction.png`。Figma上でもラスター画像なのでSVGは無い。リポジトリに置くのは暫定で、本番は`WIKI_IMAGE_BASE`で`static.igem.wiki`に向ける。
- Homeのヒーローのイラストは`public/images/hero-ukiyoe.webp`(2623×1415)と`hero-ukiyoe-1600.webp`(1600×863)。生成AI(Weave経由のNano Banana 2)で作った画像で、幅1600px以下の画面には1600版を出す。リポジトリに置くのは暫定で、本番は`WIKI_IMAGE_BASE`の先に同じ名前で置く。Attributionsに生成AIによる画像であることを明記する。
- ソースの画像URLの先頭は目印の`__WIKI_IMAGE_BASE__`で、`vite.config.ts`のプラグイン(フォントの目印と同じもの)が環境変数`WIKI_IMAGE_BASE`に置き換える。未指定なら配信パスを付けた`/images`。末尾のスラッシュは落とす。
- 本番では`WIKI_IMAGE_BASE=https://static.igem.wiki/teams/<id>/images npm run build`とし、`public/images/`の中身を同じ場所へ人がアップロードする。
