---
name: run-check
description: web/ の変更範囲に応じて、lint、型、Vitest、ビルドの検査、E2Eのスモークを選んで流し、結果を読む。確認してテストを流して変更を検証してなどと言われたときに使う。
argument-hint: "[変更範囲 | テスト名]"
allowed-tools: Bash(npm run *), Bash(npx vitest *), Bash(npx playwright *), Bash(git diff *), Bash(git status *), Bash(agent-browser *), Read
---

# run-check

web/ の変更を、変更範囲に合わせた最小の検査で確かめる。コマンドはweb/ で実行する。全件のE2EはCIに任せ、ローカルでは対応するスモークだけを流す。

## 1. 変更範囲を決める

```sh
git diff --name-only origin/main...HEAD
git status --short
```

変更したファイルを、手順4の表に当てはめる。`$ARGUMENTS`があればそれを優先する。

## 2. 毎回流す検査

```sh
cd web
npm run check:code
npm run typecheck
```

`check:code`はoxlintとoxfmtの検査で、エラー0が条件。整形の差だけなら`npm run fix`で直る。lintのエラーはルールを緩めず、コードを直す。理由があるものだけ、その行に`oxlint-disable-next-line`と理由を書く。

## 3. 変更した種類のテスト

| 変えたもの | 流すもの |
| --- | --- |
| `src/` | `npm test`(1ファイルなら`npx vitest run src/components/Island.test.tsx`) |
| `scripts/lib/*.mjs`(`check/`を除く) | `npm run test:sync` |
| `scripts/lib/check/`、`scripts/check.mjs` | `npm run test:check` |
| `src/`、`scripts/`、`content/`、`vite.config.ts`、CSS | `npm run build && npm run check` |

`Page.test.tsx`のスナップショットが落ちたら、差分が意図どおりか読んでから`npx vitest run -u`で更新する。

## 4. E2Eのスモーク

初回だけ`npx playwright install chromium`でブラウザを入れる。変更箇所に対応するテストは`web/e2e/README.md`の変更箇所とスモークの対応の表を読んで選び、`npm run test:e2e -- <名前>`で流す。

```sh
npm run test:e2e -- locale
npm run test:e2e -- --project=chromium tests/islands.e2e.ts
```

- 4173番と4174番にサーバーが残っていると、ソースを変えても古いビルドを相手にする。ソースを変えたあとは、サーバーを止めてから流す。
- E2Eは`PRERENDER_ALL=1`で`dist/`を作るので、そのあとは`npm run check`に通らない。`check`の前に`npm run build`をやり直す。
- `visual`の基準画像はmacOSで撮った暫定のもの。差が出たら、ローカルで`--update-snapshots`を掛けて上書きせず、差分画像を見て意図した変更かを判断する。
- 失敗したら`e2e/test-results/`と`npx playwright show-report e2e/playwright-report`で原因を読む。

## 5. 変更したページを開いて確かめる(agent-browser)

`command -v agent-browser`で入っているかを確かめる。無ければこの手順は飛ばし、その旨を報告する。

```sh
npm run build
npm run preview -- --port 4175 &
agent-browser open http://localhost:4175/<変更したページのパス>
agent-browser screenshot
```

見るもの: 変更した箇所が表示されること、コンソールのエラーが無いこと、言語切り替えとナビが動くこと。島を変えたときは、島のあるページで操作(開閉、切り替え)まで確かめる。終わったらpreviewのプロセスを止める。

## 6. 結果の読み方

次の形で報告する。

- 流したコマンドと結果(件数、緑か赤か)
- 赤のものは、落ちたテスト名と原因の切り分け
- 流さなかった検査と、その理由(範囲外、ブラウザ未導入など)
