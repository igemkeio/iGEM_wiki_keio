# 実装指示書: Home のヒーローに浮世絵風のイラストを敷く

Issue: なし(Home の改善。走性アニメーションの前段)
設計メモ: docs/architecture.md(「デザイン」「アニメーション」「iGEMの規定への対応」)
前提: `origin/main` から `feature/hero-illustration` を切る。PR #66(パレット切り替え)は別ブランチで並行しているので、`tokens.css` の差し色トークンの名前は変えない

## 目的

Home のヒーローの背景に、生成したイラスト(朱の太陽、藍から砂色の空、水面、右手前の松)を敷く。文字とロゴはその上に置く。既存の曲線と円の装飾は、太陽と水面が役割を引き継ぐので消す。走性のアニメーション(次のタスク)は水面の上に重ねる前提で、水面の領域を CSS の変数として持つ。

## 素材

- 元画像: `/private/tmp/claude-501/-Users-keiichi-jikuhara-Documents-iGEM/c23e26cc-cd1c-4a65-ae12-7ed3a347e6c8/scratchpad/hero-ukiyoe.webp`(2623×1415、203KB)と `hero-ukiyoe-1600.webp`(1600×863、98KB)。`web/public/images/hero-ukiyoe.webp` と `hero-ukiyoe-1600.webp` に置く。PNG(5MB)は入れない
- 生成 AI(Nano Banana 2、Weave 経由)で作った画像。暫定でリポジトリに置き、本番は `WIKI_IMAGE_BASE` で `static.igem.wiki` に向ける。README に出所を書き、Attributions に明記する前提

## レイアウト(1044px 以上)

- `.hero` の背景にイラストを `object-fit: cover`、`object-position: center bottom` で敷く。`<img>` ではなく `<picture>` で、幅 1600px 以下の画面には 1600 版を出す(`srcset`)。`alt` は空(装飾)。`loading="eager"`、`fetchpriority="high"`
- ヒーローの高さは現状(993px)のまま。横幅は本文の枠(1200px)いっぱい。角丸 24px で、周囲の背景(`--color-page`)との境を柔らかくする
- 既存の装飾(曲線2本、オレンジの円、小さい輪)と `.decoration` の SVG、そのアニメーションを消す。`--color-curve` のトークンは使われなくなるので消す
- ロゴ(One Direction)は左上に今の位置のまま。空の明るい部分に乗るので背景は不要。ただし紺の文字が藍の空に重なる上端側は避け、`top` を 112px → 144px に下げて砂色の帯に収める
- キャッチ(WITH SYNBIO)は水面の左下、`bottom: 180px`、`left: 56px`。文字色は `--color-ink`、SYNBIO の強調色は `--color-accent-blue` のまま(パレットで変わる)。水面の上で読めるよう、文字の後ろに半透明の砂色(`rgba(233,192,131,0.85)`)の帯を付けず、代わりに `text-shadow: 0 1px 0 rgba(255,255,255,0.6)` の軽い縁取りにとどめる。読みにくければ帯に切り替えてよい(報告に書く)
- 右下のブロック(iGEM Keio 2026、subtitle、説明)は松の幹と重なるので、位置を右下から右上(`top: 144px`、`right: 56px`、右揃え)に移す。藍から砂色への境目の上に乗るので、文字色は `--color-ink` のままで、`iGEM Keio 2026` だけ `--color-surface`(白)にして藍の空に置く。読みにくければ `top` を調整する
- 水面の領域を `.hero` の CSS 変数で持つ: `--hero-water-top: 48%`、`--hero-water-left: 0`、`--hero-water-right: 30%`(松を避ける)、`--hero-water-bottom: 0`。次のタスクの Canvas がこの領域に重なる。いまは変数を置くだけで、`.hero::after` などは作らない

## 1043px 以下(縦並び)

- イラストはヒーローの上部に 16:9 の帯として置く(幅 100%、角丸 16px)。その下にロゴ、キャッチ、右上ブロックの内容を縦に並べる(現状の縦並びと同じ順)。装飾なしの分岐は消す
- 375px では 1600 版を使う

## そのほか

- `prefers-reduced-motion` に関わる処理は、装飾を消すので無くなる(将来のアニメーションは次のタスクで扱う)
- `HomePage.module.css` のトークン(`--size-logo-*`、カードの値)はそのまま
- `web/README.md` の画像の節に、ヒーローのイラストの出所(生成 AI、Weave の Nano Banana 2)と置き場所、`WIKI_IMAGE_BASE` の扱いを書く
- `web/e2e/` のビジュアル回帰は home を撮っていないので変更不要。`nav` と `islands` の E2E が通ること
- `HomePage.test.tsx` と `Page.test.tsx` の home のケースは、`one-direction.png` のほかに `hero-ukiyoe` の `<picture>` が出ることを確かめる形に直す

## 受け入れ条件

- `npm run build && npm run check`、`npm test`、`npm run typecheck`、`npm run check:code`、`npm run test:e2e`(nav、islands、locale、model-viewer)が通る
- 1616×1080、1280×800、1044px、1043px、375px のスクリーンショットで、イラストの上で文字が読め、ロゴと右上ブロックが松や藍の空と不自然に重なっていない(scratchpad に保存して報告)
- `dist/images/hero-ukiyoe*.webp` が出て、合計 350KB 以下
- JS 無しで同じ見た目(イラストは静的な `<picture>`)

## 規約

- コミットは `<prefix>: 日本語一行。`(素材 add:、レイアウト feat: か refactor:、テスト test:、README docs:)
- コメントと文書は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する(向き先 main)
