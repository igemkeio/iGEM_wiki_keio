# iGEM Keio wikiの開発ガイド

iGEM Keioチームのwiki。`content/`の原稿JSONから、ViteとReactで静的HTMLを書き出す。開発対象は`web/`。仕組みと選定の理由は`docs/architecture.md`にある。

このファイルは運用ルールの本体で、人向けの手順(環境構築、PRの出し方、レビューの受け方)は`CONTRIBUTING.md`に置く。迷ったら、記載がなければIssueかPRで相談する。

## 構成

```
.
├── web/                Vite + Reactのプロジェクト。開発対象はここ
│   ├── src/            ページ、部品、島、ビルド時と実行時のコード
│   ├── scripts/        prerender、check、Notion同期、フォントのサブセット化
│   ├── e2e/            PlaywrightのE2Eとビジュアル回帰
│   └── public/         そのまま配信するファイル(フォント、画像、3Dモデル、notion-images)
├── content/            原稿JSON(content/<locale>/<slug>.json)。Notion同期が書く
├── docs/               設計メモ(architecture.md)、Notion連携(notion-sync.md)、tasks/
├── notion-trigger/     Notionのボタンから同期を起動するVercel関数。独立したプロジェクト
├── .github/            CI、Notion同期のワークフロー、Issueのテンプレート、PRのテンプレート
├── .gitlab-ci.yml      iGEMのGitLab Pagesへの配信
├── vercel.json         PRプレビューの設定
└── lefthook.yml        pre-commitフック
```

各ディレクトリの詳細は`web/README.md`、`content/README.md`、`web/e2e/README.md`、`notion-trigger/README.md`にある。

## 開発の流れ

- Node 24とnpmを使う。コマンドは`web/`で実行する。一覧は`web/README.md`。
- `main`への直接pushは禁止。ブランチを切ってPRを出す。1ブランチは1つの目的に絞る。
- ブランチ名は`<type>/<短い説明>`。typeは`feature`、`fix`、`docs`、`refactor`、`style`、`chore`。説明は英語のkebab-case。
- 移行作業中の統合先は`feature/vite-mpa`。PRの向き先はIssueの指示に従う。

### コミット

形式は`<prefix>: 目的と対象が分かる日本語。`で、末尾は句点で終える。

| prefix | 用途 |
| --- | --- |
| `feat` | 新機能の追加 |
| `add` | 新規ファイル、素材の追加 |
| `fix` | バグ修正 |
| `docs` | 文書、原稿の変更 |
| `style` | 挙動に影響しないフォーマットの変更 |
| `refactor` | 挙動を変えないコード整理 |
| `test` | テストの追加、修正 |
| `chore` | 依存更新、設定、雑務 |
| `ci` | CI設定の変更 |

- 1コミットは1つの意図。同じ意図に紐づく複数ファイルの変更は1コミットにまとめ、無関係な新規ファイルはファイルごとに分ける。
- コミットとPRにClaudeのCo-Authored-Byや、Generated with Claude Codeの表記を入れない。

### PR

- タイトルはコミットと同じ形式。本文はPRテンプレートを埋める。対応するIssueは`Closes #N`で紐付ける。
- 小さく保ち、作業中はDraftにする。マージはSquash and merge。
- `ci-passed`が`main`の必須チェック。CIは`.github/workflows/ci.yml`で、型、lint、Vitest、スクリプトのテスト、build-check、E2Eを流し、`ci-passed`が結果を集約する。

### lefthook

`npm ci`が`lefthook install`を試み、コミット時にステージした`web/`配下のファイルへ`oxlint --fix`、`oxfmt --write`、`npm run typecheck`を流す。直せない指摘があるとコミットは止まる。`core.hooksPath`を設定している環境での入れ方は`web/README.md`のpre-commitの節にある。

## コードの約束

- ビルド時にNodeで動く`src/`のコードでは`window`と`document`を触らない。ブラウザでしか動かないコードは`src/client/`に置く。
- 対話が必要な部品だけを島にする。島を足す手順は次のとおり。
  1. 部品を`src/components/`に書く。
  2. `src/client/islands.tsx`の対応表に島の名前と部品を足す。
  3. `src/islands.ts`の`ISLANDS`に、差し込み位置とpropsを足す。
  4. 原稿JSONの`islands`に島の名前を書く。Notion同期が出すページは`web/scripts/lib/page.mjs`の`ISLANDS_BY_SLUG`にも足す。
- 状態を持たない動き(ホバー、フェードイン)はCSSで書き、島にしない。
- ページをまたぐ状態は`usePersistedState`で保存領域に置く。状態管理ライブラリは入れない。
- CSSは素のCSSとCSS Modulesで書き、Tailwindなどのフレームワークは入れない。
  - 色、フォント、余白、本文の幅は`src/styles/tokens.css`の`:root`にカスタムプロパティで置く。
  - 部品の見た目は同じ場所の`*.module.css`に、`@layer components`の中で書く。
  - Notionから出る本文のスタイルは`src/styles/prose.css`に、要素に対して当てる。
- 内部リンクと静的ファイルのパスは、`base`を付けるヘルパー(`src/base.ts`の`withBase`)を通す。配信パスが`/`と`/keio/`の両方で動く必要がある。
- lintのルールは緩めない。理由があって守れないものだけ、行の直前に`// oxlint-disable-next-line <rule> -- <理由>`と書く。
- 原稿JSONの形式は`content/README.md`が正。

## テスト

| 層 | 道具 | 内容 |
| --- | --- | --- |
| 型 | `npm run typecheck` | `src/`とE2Eの型 |
| ユニット、コンポーネント | `npm test`(Vitest) | `src/`のロジック、部品、プリレンダーのスナップショット |
| スクリプト | `npm run test:sync`、`npm run test:check` | Notion同期とcheckの関数(`node:test`) |
| 出力の検査 | `npm run build && npm run check` | ページ数の一致、外部URL、リンク切れ、`alt` |
| E2E、ビジュアル回帰 | `npm run test:e2e`(Playwright) | ページをまたぐ状態、島、JSの配信範囲、3D |

- ローカルでは変更範囲に対応するテストだけを流し、全件はCIに任せる。変更箇所とE2Eの対応表は`web/e2e/README.md`にある。
- `Page`やマークアップを意図して変えたら、スナップショットの差分を確認してから`npx vitest run -u`で更新する。
- ビジュアル回帰の基準画像は、ローカルで上書きしない。作り直し方は`web/e2e/README.md`にある。

## Notion同期

原稿の正はNotionにある。`content/**/*.json`は同期で上書きされるので、Notionのページは直接編集しない。リポジトリ側で置く確認用ページはJSONに`"source": "local"`を付ける。同期はGitHub Actionsが毎日と手動で走り、差分があれば`chore/notion-sync`ブランチにPRを作る。手順、プロパティ、Notionのブロックとの対応、必要なSecretsは`docs/notion-sync.md`にある。

## iGEMの規定

- 外部のスクリプト、CSS、フォントを読み込まない。ライブラリはnpmで入れてViteに束ねる。
- 画像、フォント、3Dモデルは`static.igem.wiki`に、動画はiGEM Video Universeに置く。`npm run check`が、これら以外の外部URLを違反として落とす。
- `web/public/`の画像、フォント、3Dモデルは暫定の置き場で、本番では`WIKI_IMAGE_BASE`、`WIKI_FONT_BASE`で`static.igem.wiki`に向ける。大きなバイナリを新たにコミットしない。
- `LICENSE`(CC BY 4.0)は変更しない。
- 最終のwikiはiGEMのGitLabに置く必要がある。GitLab Pagesへの配信は`.gitlab-ci.yml`で、設定は`web/README.md`のCIと配信の節にある。
