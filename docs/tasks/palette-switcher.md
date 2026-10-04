# 実装指示書: カラーパレットの切り替え(比較用)

Issue: なし(デザイン検討の補助)
設計メモ: docs/architecture.md(「デザイン」「ツールチェーン」の CSS)

## 目的

3つのカラーパレットを同じサイト上で切り替えて見比べられるようにする。選択はブラウザに残り、ページを移っても保たれる。切り替えの UI は Vercel のプレビューでだけ出し、本番(main の配信)には出さない。

## パレット

背景 `#dfe4ea` と文字 `#0d0f12` は共通。変えるのは差し色だけ。

| トークン | 既定(現状) | a | b | c |
|---|---|---|---|---|
| `--color-accent`(ヒーローの円、カードのホバー、島の強調) | `#ffb347` | `#e83929` | `#f39800` | `#e2b540` |
| `--color-accent-2`(WITH SYNBIO の強調、リンク、目次の現在位置) | `#2962ff` | `#00a3af` | `#1e50a2` | `#1c4286` |
| `--color-note-dot`(Note の点) | `#f43a1f` | `#f5e56b` | `#d3381c` | `#ebd3a2` |
| `--color-curve`(ヒーローの曲線) | 現状のまま | 現状のまま | 現状のまま | 現状のまま |

既存のトークン名が上と違う場合は、既存の名前に合わせて上書きし、名前を変えない。差し色がトークンを通らずに直接書かれている箇所(HomePage.module.css のオレンジや青、prose.css の Note の点、リンクの色など)があれば、トークンに寄せる。

## 変更範囲

- `web/src/styles/tokens.css`: `:root` の既定はそのまま。`:root[data-palette="a"]`、`"b"`、`"c"` で上の3トークンを上書きする
- `web/src/Page.tsx`: 環境変数 `WIKI_PALETTE_SWITCHER` が `1` のときだけ、`<head>` の先頭に短いインライン `<script data-palette-switcher>` を出す。中身は次の2つ
  1. 描画前に `localStorage` の `wiki:palette` を読み、`document.documentElement.dataset.palette` に入れる(ちらつきを防ぐため head で同期的に実行)
  2. `DOMContentLoaded` 後に、画面右下に小さな切り替え UI(既定、a、b、c の4つのボタン。現在の選択を強調)を描き、押すと `dataset.palette` と `localStorage` を更新する。`?palette=b` のクエリでも切り替わる
  スクリプトは `web/src/palette-switcher.ts` に素の TypeScript で書き、ビルド時に文字列として読み込んで埋め込む(Vite の `?raw` import)。React は使わない。DOM を触るのはこのファイルだけで、ビルド時コードからは文字列として扱う
- `web/vite.config.ts`: `WIKI_PALETTE_SWITCHER` を `define` で `Page.tsx` に渡す(他の環境変数と同じ方法)
- `vercel.json`: `buildCommand` を、`VERCEL_ENV` が `production` でなければ `WIKI_PALETTE_SWITCHER=1` を付けて build する形にする(例: `sh -c 'if [ "$VERCEL_ENV" != production ]; then export WIKI_PALETTE_SWITCHER=1; fi; npm run build && npm run check'`)
- `web/scripts/lib/check/html.mjs`: 島のないページの `<script>` 検査で、`data-palette-switcher` 属性を持つインライン script だけは許す(src は持たない)。テストを足す
- `web/README.md`: パレットの切り替えの節(トークン、環境変数、プレビューでの見方)
- テスト: tokens の上書きがあること(CSS を読んで3つのセレクタがあるか)、`Page` が環境変数なしでは script を出さず、ありでは `data-palette-switcher` の script を1本出すこと、check が許すこと

触らないファイル

- `content/`、`web/scripts/notion-sync.mjs`、`islands` まわり、E2E(ビジュアル回帰の基準画像は既定パレットのまま変わらない)

## 受け入れ条件

- `npm run build`(環境変数なし)で、どのページの HTML にも `data-palette-switcher` の script が無い。`npm run check` が通る
- `WIKI_PALETTE_SWITCHER=1 npm run build` で、全ページに script が1本入り、`npm run check` が通る。`npm run preview` で開くと右下に切り替えがあり、押すと円、SYNBIO、Note の点の色が変わる。別のページへ移っても選択が保たれ、ちらつかない。`?palette=c` でも切り替わる
- JS が無い環境では既定の色で表示される
- `npm test`、`npm run typecheck`、`npm run check:code`、`npm run test:check` が通る

## 規約

- コミットは `<prefix>: 日本語一行。`(トークン、スイッチャー、check、Vercel、README)
- コメントと文書は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する(向き先 main)
