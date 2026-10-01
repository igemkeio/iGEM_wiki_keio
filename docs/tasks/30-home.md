# 実装指示書: #30 Home のテンプレート

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/30
設計メモ: docs/architecture.md(「デザイン」「アニメーション」)
原稿の形式: content/README.md(Home で使うフィールドの節)
Figma: fileKey `ZK1xe32Ezu2DIbkPbDTfHd`、Home フレーム `3:2`。ヒーロー `3:16`、ロゴ `3:3`(One Direction)、キャッチ `3:19`、右下のブロック `3:27`、Contents `3:40`、カード `3:50`
前提: #28 がマージ済みの `feature/vite-mpa` から分岐する

## 目的

Home は本文ページと別のレイアウト。ヒーロー(ロゴ、装飾、キャッチ)と Contents のカードを持つ。

## 変更範囲

触るファイル

- `web/src/components/HomePage.tsx` と `.module.css`(新規)
- `web/src/Page.tsx`: `slug === "home"` のとき `ArticlePage` ではなく `HomePage` を `PageShell` に入れる
- `web/public/images/one-direction.svg`(新規): Figma の `3:3` を SVG で書き出す(`get_design_context` のアセット URL から取得)。本番では `static.igem.wiki` に置くので、`WIKI_FONT_BASE` と同じ仕組みで先頭を差し替えられるよう、画像用の `WIKI_IMAGE_BASE`(既定は base 付きの `/images`)を `vite.config.ts` の同じプラグインに足す
- `web/src/styles/tokens.css`: カードの値など足りないトークン
- `web/src/HomePage.test.tsx`(新規): 固定のページ一覧を渡して、カードが `order` 順に出ること、home 自身が除かれること、`html` が空なら本文が出ないこと、ロゴ画像に alt があること
- `web/src/Page.test.tsx`: home のケースを足す

触らないファイル

- `web/scripts/`、`routes.ts`、`content.ts`、`Sidebar`、`Footer`、`PageShell`、`ArticlePage`、`prose.css`

## 構成(Figma の Home フレーム)

ヒーロー(`3:16`、高さ約 993px)

- ロゴ画像(One Direction、`3:3`): 枠の左上。幅 632px、高さ 228px(`19:2`)。`<img>` に `alt="One Direction"`。`<h1>` は視覚的に隠した `title` を置く(`<h1 class="visually-hidden">`)
- 装飾の曲線と円(`3:4`、`3:5`、`3:17`、`3:18`): インライン SVG で描く(`get_design_context` のパスを使う)。曲線は `stroke-dasharray` で描かれるアニメーション(8秒、1回)、オレンジの円(`#ffb347` 前後、Figma の値を正とする)はゆっくり上下に揺れる(6秒、無限)。`prefers-reduced-motion: reduce` では止める。アニメーションは CSS の `@keyframes` だけで、JS を使わない
- キャッチ(`3:23`): WITH SYNBIO。Montserrat 32px、SYNBIO は青(`#2962ff` 前後、Figma の値を正とする)。`lead` フィールドの内容をここに出す(簡単な HTML を許す)
- 右下のブロック(`3:27`): iGEM Keio 2026(Montserrat 48px、右揃え)、走性を、設計する。(Noto Sans JP Bold 14px)、説明(12px、`#5d646e`、幅 448px)。ここは `html` フィールドの先頭ではなく、`subtitle` を走性を、設計する。の位置に、`html` を説明の位置に出す。`html` が空なら説明を出さない

Contents(`3:40`)

- 見出し CONTENTS(Montserrat 92.8px、大文字、ArticlePage の h1 と同じ値)と小見出し コンテンツ(ja では Contents)
- カード(`3:50`)を2列(間隔 20px)。各カードは白背景、角丸 24px、余白 48px、高さ 178px。中は `title`(Montserrat 24px、大文字)、`subtitle`(Noto Sans JP 12px、`#5d646e`)、`lead`(14px)。カード全体がリンク(`<a>` でカードを包む)
- 出すのは現在の locale の published なページを `order` 順に並べ、home 自身を除いたもの。`lead` が空のページも出す(空のまま)
- 768px 未満では1列、余白 24px

フッターは PageShell のまま。

## 受け入れ条件

- `/` と `/ja/` が Figma の Home フレームと一致する(1616px のスクリーンショットを添える)
- カードが Notion の `order` 順に並び、home が含まれない
- 装飾のアニメーションが動き、`prefers-reduced-motion: reduce` では静止する(Chrome の DevTools で確認できなければ、CSS を読んで報告に書く)
- `dist/index.html` に `<script>` が無い
- `npm run check`(ロゴ画像の alt、内部リンク)、`npm test`、`npm run typecheck`、`npm run build` が通る
- 375px で1列になる

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(HomePage の骨格、ヒーローと装飾、Contents カード、画像の base、テスト)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
