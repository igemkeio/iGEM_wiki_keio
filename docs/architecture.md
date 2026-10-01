# wikiの技術構成

iGEM Keioのwikiを構成する仕組みと、その判断理由をまとめる。開発ルールはAGENTS.mdに、参加の手順はCONTRIBUTING.mdに、Notion連携の手順はnotion-sync.mdにある。

## 全体像

```
Notion(原稿) ─sync─> content/<locale>/<slug>.json ─prerender─> dist/**/index.html ─> GitLab Pages / Vercel
                                                        ↑                   ↑
                                                  src/Page.tsx        islands.tsx(対話部品だけ)
```

- 原稿の正はNotionにある。同期スクリプトが1ページ1つのJSONに書き出す。
- ビルド時にReactでHTMLを生成する。ページの数だけHTMLファイルができる、いわゆるMPAで、SPAではない。
- ブラウザでReactが動くのは、対話が必要な部品(島)の中だけ。島のないページにはReactのJSが含まれない。
- 配信先はiGEMのGitLab Pagesで、PRごとのプレビューはVercelが担う。どちらも静的ファイルを置くだけで、サーバー側の処理はない。

## 選定の理由

Next.jsをやめてViteとReactに置き換えた。Next.jsは静的書き出しでしか使っておらず、ルーティングとプリレンダーの2つの仕事のために、App Routerの概念とツールチェーン全体を持ち込んでいた。この2つは短いスクリプトで書けるので、自分のリポジトリに持つ。

SPAにしなかったのは、審査員がURLを直接開く使われ方が中心で、ページごとにHTMLがある方が表示が速く、GitLab Pagesで404のフォールバックも要らないため。

Reactは残す。アニメーションや対話的な図(モデルのパラメータを動かす、3Dモデルを表示する)を作る予定があり、そこではReactの部品として書く方が扱いやすい。

## 原稿の受け渡し形式

Notion同期とプリレンダーをつなぐ唯一の約束事。`content/<locale>/<slug>.json`に置く。

```json
{
  "slug": "model",
  "locale": "en",
  "title": "Model",
  "lead": "簡単なHTMLを含んでよい",
  "html": "<h2 id=\"overview\">Overview</h2><p>...</p>",
  "islands": ["model-sim"]
}
```

- `slug`と`locale`の組がURLになる。`en`は`/model/`、`ja`は`/ja/model/`。
- `html`は同期時にMarkdownから変換済みで、見出しには`id`が付いている。目次はこの`id`から作る。
- 数式は同期時にKaTeXで描画してHTMLにする。ブラウザにはKaTeXのCSSだけ届く。
- `islands`は、そのページで使う島の名前。ここに挙がった島のJSだけをそのページに読み込む。

## ルーティングとプリレンダー

- `src/routes.ts`が`content/`を読んでページ一覧を作る。
- `scripts/prerender.mjs`が一覧を回し、`renderToStaticMarkup(<Page />)`の結果を`dist/<path>/index.html`に書く。Viteが出したCSSとJSのハッシュ付きファイル名は、ここで`<link>`と`<script>`として差し込む。
- ページ間の移動は普通の`<a href>`。ブラウザ側のルーターは持たない。
- `src/`のビルド時に動くコードでは`window`と`document`を触らない。Nodeで実行されるため。

## 島(islands)

対話が必要な部品だけをブラウザで動かす仕組み。

- ビルド時は`<div data-island="member-list" data-props="...">`という器だけを出す。
- `src/islands.tsx`が器を見つけて`createRoot`で起動する。島の名前と部品の対応表はこのファイルに置く。
- 島の一覧: `member-list`(メンバーのモーダル)、`model-viewer`(3Dモデルの表示)、`attribution-form`(iGEMの貢献者フォーム)。増えたらここに足す。
- 島の中でも、状態を持たない動き(ホバー、フェードイン、スクロールで現れる)はCSSに任せ、Reactを使わない。

## 状態の永続化

MPAではページを移るとJSのメモリが消えるので、状態はブラウザの保存領域に置く。

| 置き場所 | 用途 |
|---|---|
| `localStorage` | 言語の選択、配色の設定など、ブラウザに残したいもの |
| `sessionStorage` | 一度見たアニメーションを再生しないなど、タブを閉じるまでのもの |
| URL | モデルのパラメータなど、リンクとして共有したいもの |

- `usePersistedState(key, initial, storage)`が読み書きを包む。壊れたJSONや保存領域が使えない環境では`initial`に戻す。
- 同じページの島の間で状態を共有するときは、`useSyncExternalStore`で書いたモジュールスコープのストアを使う。状態管理ライブラリは入れない。
- 言語は切り替えリンクで移る。保存された言語へ自動で飛ばす処理はしない。審査員が英語で開いたときに日本語へ飛ぶ事故を避けるため。

## アニメーション

| 種類 | 実現方法 |
|---|---|
| ホバー、フェードイン | CSSの`transition`と`@keyframes` |
| スクロールに反応 | `IntersectionObserver`を使う短いJS |
| 状態を持つ対話 | 島 |
| ページ遷移 | View Transitions API(`@view-transition { navigation: auto; }`)。非対応のブラウザでは通常の遷移になる |

## 3Dモデル

- Blenderで作り、glTF(.glb)で書き出す。1モデル2〜5MB以下を目安にする。Draco圧縮とKTX2テクスチャは、デコーダーを`public/models/decoders/`に置くまで使わない。`<model-viewer>`の既定ではデコーダーをgstatic.comから取りに行くため、`ModelViewer`はその既定値を自前の場所に差し替えている。
- .glbは画像と同じ扱いで`static.igem.wiki`に置く。リポジトリには入れない。暫定のサンプルだけ`public/models/`にあり、本番の配信前に消す。
- 表示は`<model-viewer>`を島として包む。画面に入ってから読み込み、読み込み前とWebGL非対応時はレンダリング済みの静止画を出す。
- カメラや演出を自分で組む必要が出たら、React Three Fiberの島を別に作る。

## デザイン

Figmaのデザイン案(iGEM Keio 2026 Wiki Pages)を正とする。

- レイアウトは左に固定のサイドバー(ロゴとナビ)、右に幅1200pxの本文。上部のヘッダーは持たない。
- 375pxでは、上部に細いバー(ロゴと開くボタン)を置き、押すとナビが降りてくる。この形はこちらで決め、実装後にFigmaへ書き戻す。
- ナビはNotionにある`published`なページから生成する。固定のページ一覧は持たない。表示順はNotionの`order`プロパティで決める。
- Homeは専用のテンプレート(ヒーロー、Contentsのカード)。カードはページ一覧から生成する。
- 本文ページの型は、見出し、日本語の小見出し、リード、本文、Figureカード、Note。Membersもこの型を使う。
- Figureカード(図と説明を点線で区切る2カラム)とNoteは、Notionのブロックから同期時に出す。対応はnotion-sync.mdに書く。
- フォントは見出しとナビがMontserrat、本文がNoto Sans JP。どちらもSIL Open Font License。Noto Sans JPはサブセット化してwoff2にし、`static.igem.wiki`に置いて`@font-face`で読む。
- 色や文字サイズなどのトークンはFigmaの値を`src/styles/tokens.css`に写す。

## iGEMの規定への対応

- 外部のスクリプト、CSS、フォントは読み込まない。ライブラリはnpmで入れてViteに束ねる。フォントは`static.igem.wiki`に上げて`@font-face`で読む。
- 画像、動画、3Dモデルは`static.igem.wiki`とiGEM Video Universeに置く。
- `npm run check`が`dist/`を走査し、`static.igem.wiki`と`video.igem.org`以外の外部URLがあれば落とす。
- LICENSE(CC-BY-4.0)は変えない。

## 配信パス

GitLab Pagesは`https://2026.igem.wiki/keio/`のようにサブパスで配信される。Vercelはルート。Viteの`base`を環境変数`WIKI_BASE`で切り替え、リンクは`base`を付けるヘルパー経由で書く。

- GitLabでは`WIKI_BASE=/$CI_PROJECT_NAME/`としている。iGEMのwikiが`https://2026.igem.wiki/<team>/`で配信され、GitLabのプロジェクト名が`<team>`と一致していることが前提。
- Vercelはプロジェクト設定のRoot Directoryを`web`にし、`vercel.json`の`outputDirectory`は`dist`にしてある。詳細は`web/README.md`のCIと配信の節にある。
- CIのbuild-checkが、`/`と`/keio/`の両方でbuildとcheckを流す。

## ツールチェーン

- Node 24(Active LTS)に固定する。`.node-version`と`package.json`の`engines`に書く。
- npmを使う。
- TypeScriptは`strict: true`。
- LintとFormatはUltracite経由のoxlintとoxfmt。lefthookのpre-commitで自動修正し、型検査も流す。
- CSSは素のCSSとCSS Modulesで書く。Tailwindなどのフレームワークは入れない。
  - トークン(色、フォント、余白、本文の幅)は`src/styles/tokens.css`の`:root`にカスタムプロパティで置く。
  - 部品ごとの見た目は、部品と同じ場所の`.module.css`に書く。
  - Notionから出る本文のスタイルは`src/styles/prose.css`に、要素に対して当てる。
  - 優先順位は`@layer reset, tokens, prose, components`で固定する。
- 開発は`npm run dev`(Viteの`build --watch`と`preview`の並走)。開発時と本番時で描画の経路を分けない。

## テスト

| 層 | 道具 | 検査するもの |
|---|---|---|
| 型 | `tsc --noEmit` | Node側とブラウザ側の境界 |
| ユニット | Vitest | `toc.ts`、`routes.ts`、`usePersistedState`、`applyBase` |
| スクリプト | `node:test` | Notion同期の変換、`check`の検査関数 |
| コンポーネント | Vitest、Testing Library、happy-dom | `Sidebar`、`Toc`、各島 |
| プリレンダー | Vitest | サンプルJSONからのHTML生成をスナップショットで固定 |
| 出力の検査 | `npm run check` | ページ数の一致、外部URL、リンク切れ、`alt`の欠落 |
| E2E | Playwright(chromium、mobile-chromium 375px、`/keio/`配信のchromium-base) | ページをまたぐ状態の保持、島の動作、島のないページでReactが読まれないこと、3Dの遅延読み込み |
| ビジュアル回帰 | Playwrightのスクリーンショット比較 | 主要ページを2つの幅で撮る |

- CIは全件を流す。lint、型、Vitest、スクリプトのテスト、build-checkを並列に、そのあとE2E、最後に集約ジョブ`ci-passed`1本を必須チェックにする。
- ローカルでは変更範囲に対応するE2Eスモークだけを流す。対応表は`e2e/README.md`にある。
- 探索的な確認(見た目、操作感)はagent-browserで行う。

## 運用

- `main`は保護し、PR経由でだけ変える。
- Notion同期はGitHub Actionsが毎日と手動で走り、差分があればPRを作る。Notionのボタンからは`notion-trigger/`(独立したVercel関数)経由で起動する。
- 運用ルールの本体はAGENTS.mdに置き、CLAUDE.mdはそれを読み込むだけにする。人向けの手順はCONTRIBUTING.mdに置く。

## 範囲外

- Notionの画像を`static.igem.wiki`へ自動で上げる仕組み(Issue #13)。同期時に画像URLの一覧を出すだけにし、アップロードは人が行う。
