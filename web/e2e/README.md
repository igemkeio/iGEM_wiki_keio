# E2E とビジュアル回帰

ビルド済みのwikiをChromiumで開き、MPAでしか確かめられない振る舞いを固定する。ページをまたぐ状態、島の動作、JSの配信範囲、3Dの遅延読み込みが対象。設計は`docs/architecture.md`の「テスト」にある。

## 構成

| ファイル | 内容 |
| --- | --- |
| `playwright.config.ts` | project、webServer、スクリーンショットの許容差 |
| `fixtures.ts` | 全テストに掛ける外部リクエストの遮断と、パスの補助関数 |
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

## 外部リクエストの遮断

`fixtures.ts`が全テストに自動で掛かり、`localhost`以外へのリクエストを失敗させて記録する。1件でもあればテストが落ちる。外部リソースを`static.igem.wiki`などの許可先に限る規定を、ビルド後の動作でも固定するため。

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

UIモード、失敗時のトレース確認は次のとおり。

```sh
npm run test:e2e:ui
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
| `MemberList` | `islands`、`visual` |
| `ModelViewer` | `model-viewer` |
| `prose.css`、`ArticlePage`、`HomePage`、`tokens.css`、`global.css` | `prose`、`visual` |
| `vite.config.ts`、`base.ts`、`prerender.mjs` | 全件(特に`chromium-base`) |
| `content/`のページの増減 | `nav`、`mobile/sidebar`、`visual`(Homeのカード) |

## ビジュアル回帰

`tests/visual.e2e.ts`が`/`、`/members/`、`prose-sample`を1280pxと375pxで撮る。`auto-rotate`で動く3Dのページは撮らない。アニメーションは止めて(`animations: "disabled"`)、フォントの読み込みを待ってから撮る。

- 基準画像は`tests/visual.e2e.ts-snapshots/`にあり、git管理に入れる。ファイル名にOSを含めず、どの環境でも同じ画像と比べる。
- 比較は`maxDiffPixelRatio: 0.02`で緩める。LinuxのCIとmacOSでは字形のずれがわずかに出るため。
- 基準にするのはLinuxのCIで撮った画像。CIを入れたら、CIで画像を生成し直して差し替える。ローカルで`--update-snapshots`をかけて、そのまま上書きしない。
- 見た目を意図して変えたときだけ、CIの成果物の画像を`tests/visual.e2e.ts-snapshots/`に入れてコミットする。
- 現在の基準画像はmacOSでローカルに生成した暫定のもの。
- `prose-sample`は#29(prose)がマージされるまで`test.skip`にしている。

## skipしているテスト

- `prose.e2e.ts`と`visual.e2e.ts`の`prose-sample`: #29(prose)が未マージで、ページも`prose.css`も無い。マージ後に`test.skip`を外し、`content/{en,ja}/prose-sample.json`の有無を確認して基準画像を生成する。

## CIのジョブ定義(案)

#38の`.github/workflows/ci.yml`がマージされたあとに足す。型、Vitest、build、checkを並列に流すジョブの後に置き、集約ジョブの`needs`に加える。

```yaml
  e2e:
    needs: [typecheck, test, build]
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
        working-directory: web
      - run: npx playwright install --with-deps chromium
        working-directory: web
      - run: npm run test:e2e
        working-directory: web
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: |
            web/e2e/playwright-report/
            web/e2e/test-results/
          retention-days: 7
```

- `CI`環境変数があると、`retries: 1`、`trace: on-first-retry`、HTMLレポートが有効になり、`reuseExistingServer`が無効になる。
- 基準画像を作り直すときは、`workflow_dispatch`で`npm run test:e2e -- --update-snapshots`を流し、`tests/visual.e2e.ts-snapshots/`を成果物として出すジョブを別に用意する。
