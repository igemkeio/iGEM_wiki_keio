# E2Eとビジュアル回帰

ビルド済みのwikiをChromiumで開き、MPAでしか確かめられない振る舞いを固定する。ページをまたぐ状態、島の動作、JSの配信範囲、3Dの遅延読み込みが対象。設計は`docs/architecture.md`のテストの節にある。

## 構成

| ファイル | 内容 |
| --- | --- |
| `playwright.config.ts` | project、webServer、スクリーンショットの許容差 |
| `fixtures.ts` | 全テストに掛ける外部リクエストの扱いと、パスの補助関数 |
| `pages.ts` | `content/`のpublishedなページの一覧と、言語ごとのナビのラベル |
| `server/prepare.mjs` | E2E用のビルド。`/keio/`付きと、付かないものの2つを作る |
| `server/serve-base.mjs` | `/keio/`付きのビルドを配信する静的サーバー |
| `tests/*.e2e.ts` | 1ファイル1テーマのテスト |
| `tests/mobile/*.e2e.ts` | 375pxのテスト |

## project

| project | 幅 | 対象 | baseURL |
| --- | --- | --- | --- |
| `chromium` | 1280x800 | `tests/`(`mobile/`を除く) | `http://localhost:4173/` |
| `mobile-chromium` | 375x812(Pixel 5相当) | `tests/mobile/` | `http://localhost:4173/` |
| `chromium-base` | 1280x800 | `nav`、`locale`、`islands`、`model-viewer` | `http://localhost:4174/keio/` |

テストはパスを先頭に`/`を付けない相対(`page.goto("members/")`)で書く。baseURLの末尾が`/`なので、`/`でも`/keio/`でも同じテストが動く。

## E2E用のページ

`content/en/e2e-model.json`(3Dのページ。enだけにあり、言語切り替えがhomeに向く場合の確認にも使う)と`content/{en,ja}/e2e-plain.json`(島のないページ。両言語にあり、切り替えが同じslugに向く場合の確認に使う)。3つとも`published: false`。

ビルドを`PRERENDER_ALL=1`で走らせると、`scripts/prerender.mjs`が`published: false`のページも書き出す。このとき書き出し数の突き合わせは、`content/`の全ページ数と行う。ナビとHomeのContentsカードにもE2E用のページが並ぶ。通常のビルドでは何も変わらない。

`PRERENDER_ALL=1`で作った`dist/`には、原稿に対応しないページがあるので`npm run check`が落ちる。E2Eを流したあとに`check`をかけるときは、`npm run build`を通常どおりやり直す。

## /keio/ 付きの配信

`vite preview`は`--base`を読まないので、`/keio/`付きのビルドはNodeの`http`で数行の静的サーバー(`server/serve-base.mjs`)で配信する。`server/prepare.mjs`が次の順で動く。

1. `WIKI_BASE=/keio/ PRERENDER_ALL=1 npm run build`をして、`dist/`を`e2e/.site/keio/`にコピーする
2. `PRERENDER_ALL=1 npm run build`をして、`dist/`を作り直す(`npm run preview`が4173番で配信する)

`serve-base.mjs`は`e2e/.site/ready`ができるのを待ってから4174番で待ち受ける。`e2e/.site/`はgit管理外。

## 外部リクエストの扱い

`fixtures.ts`が全テストに自動で掛かる。

- 許可ホスト(`igem.org`と`igem.wiki`、サブドメインを含む。`static.igem.wiki`と`video.igem.org`はこれに入る)へのリクエストは、実際には出さず空のダミーを返す。画像なら1x1のPNG、それ以外は200の空。違反には数えない。
- それ以外の`localhost`以外へのリクエストは失敗させて記録する。1件でもあればテストが落ちる。

外部リソースを許可ホストに限る規定を、ビルド後の動作でも固定するため。

## ローカルでの実行

初回だけブラウザを入れる。

```sh
cd web
npx playwright install chromium
```

全部を流す。ビルドも自動で走る。

```sh
npm run test:e2e
```

1本だけ流す。

```sh
npm run test:e2e -- locale
npm run test:e2e -- --project=chromium tests/islands.e2e.ts
npm run test:e2e -- -g "Escで閉じる"
```

UIモードで流す。

```sh
npm run test:e2e:ui
```

HTMLレポートは、ローカルでもCIでも実行のたびに`e2e/playwright-report/`へ出る(自動では開かない)。トレースはCIで、失敗して再試行したときだけ付く。

```sh
npx playwright show-report e2e/playwright-report
```

ローカルでは`reuseExistingServer`が有効で、4173番と4174番が起動していればビルドを省く。ソースを変えたあとは、サーバーを止めてから流す。

3Dのテストはヘッドレスで`--use-angle=swiftshader --enable-unsafe-swiftshader`を付けて、ソフトウェアのWebGLを使う。マシンが重いと`loaded`になるまで数秒かかる。

## 変更箇所とスモークの対応

ローカルでは変更範囲に対応するスモークだけを流し、全件はCIに任せる。

| 変えたもの | 流すテスト |
| --- | --- |
| `Sidebar`、`PageShell`、ナビ | `nav`、`mobile/sidebar`、`locale` |
| `src/client/`(島の起動、保存、言語) | `islands`、`locale` |
| `Island`、`islands.ts`、`Page.tsx`の`<script>`の出し分け | `islands`、`model-viewer` |
| `MemberList` | `islands` |
| `ModelViewer` | `model-viewer` |
| `prose.css`、`ArticlePage`、`tokens.css`、`global.css`、`Sidebar`、`Footer` | `prose`、`visual` |
| `HomePage` | `nav`(Homeのカード) |
| `vite.config.ts`、`base.ts`、`prerender.mjs` | 全件(特に`chromium-base`) |
| `content/`のページの増減 | `nav`、`mobile/sidebar` |

## ビジュアル回帰

`tests/visual.e2e.ts`が`prose-sample`と`e2e-plain`を1280pxと375pxで撮る。どちらもリポジトリ側で原稿を固定した確認用ページで、Notionの原稿が変わっても画像は変わらない。homeとmembersは原稿で見た目が変わるので撮らない。`auto-rotate`で動く3Dのページは撮らない。アニメーションは止めて(`animations: "disabled"`)、フォントの読み込みを待ってから撮る。

- 基準画像は`tests/visual.e2e.ts-snapshots/`にあり、git管理に入れる。ファイル名にOSを含めず、どの環境でも同じ画像と比べる。
- 比較は`maxDiffPixelRatio: 0.02`で緩める。LinuxのCIとmacOSでは字形のずれがわずかに出るため。
- 基準にするのはLinuxのCIで撮った画像。ローカルで`--update-snapshots`をかけて、そのまま上書きしない。
- 基準画像はCI(Linux)で生成する。更新手順は下記。
- サイドバーのナビにはE2E用ページを含む全ページが並ぶ(`PRERENDER_ALL=1`で出る)ので、E2E用ページを足したときは画像を撮り直す。

### 基準画像の作り直し

PRを作ったあとに、メインセッションが次の手順で行う。

1. GitHub ActionsでCIを`workflow_dispatch`で実行し、入力`update_snapshots`をtrueにする。`e2e`ジョブが`npm run test:e2e -- --update-snapshots=all`を流し(テストが落ちてもジョブは落とさない)、`web/e2e/**/*-snapshots/`をartifact`e2e-snapshots`に上げる
2. artifactの画像で`tests/visual.e2e.ts-snapshots/`を差し替えてコミットする

## CI

`.github/workflows/ci.yml`の`e2e`ジョブが流す。型、Vitest、スクリプトのテスト、build-checkの後に置き、`ci-passed`の`needs`に入れてある。`CI`環境変数があると、`retries: 1`、`trace: on-first-retry`になり、`reuseExistingServer`が無効になる。レポートと`test-results/`はartifact`playwright-report`に上がる。
