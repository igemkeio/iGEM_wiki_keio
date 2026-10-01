# 実装指示書: #29 本文のスタイル、Figure カード、Note

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/29
設計メモ: docs/architecture.md(「デザイン」「ツールチェーン」の CSS の節)
原稿の形式: content/README.md(Figure カードと Note の HTML の形、見出し id)
Figma: fileKey `ZK1xe32Ezu2DIbkPbDTfHd`、Results フレーム `4:2`。本文 `4:26`、Figure カード `4:34`、Note `4:56`
前提: #28(レイアウト)と #27(Notion 同期)がマージ済みの `feature/vite-mpa` から分岐する

## 目的

Notion から出る本文の HTML(`.prose` の中)に、Figma の本文ページの見た目を当てる。Figure カードと Note も含む。

## 変更範囲

触るファイル

- `web/src/styles/prose.css`(新規): `@layer prose` の中身。`global.css` から import する
- `web/src/components/ArticlePage.tsx` と `.module.css`: 見出し部分(h1、subtitle、lead)の値が Figma とずれていれば直す。本文の幅はここでは当てない
- `web/src/styles/tokens.css`: 足りないトークンを足す(段落の間隔、カードの角丸、点線の色など)
- `web/src/main.tsx`: KaTeX の CSS を import する(`katex/dist/katex.min.css`)。katex は #27 で `web/package.json` に入っている。フォント(KaTeX 同梱の woff2)は Vite が `dist/assets/` に出す
- `web/src/Page.test.tsx` などの既存テストが落ちたら、意図を保って直す
- `content/en/prose-sample.json`(新規、`published: false`): 見出し、段落、リスト、表、引用、コード、画像、Figure カード、Note、数式を全部含む確認用のページ。`published: false` なのでビルドには出ないが、テストとスクリーンショットで使う。Vitest のテストでこの JSON を読み、スナップショットを取る

触らないファイル

- `web/scripts/`、`web/src/routes.ts`、`content.ts`、`Sidebar`、`Footer`、`PageShell`、`Toc`

## スタイル(Figma の値)

本文(`.prose` の直下の要素に当てる。`.prose` 自身には幅を当てない)

- p、ul、ol、blockquote、pre、table、h2、h3: `max-width: var(--size-prose)`(672px)
- p: Noto Sans JP 16px、行間 31.2px、段落の間隔 12.8px(Figma の `Paragraph:margin` の pt)
- h2: Figma の `Heading 2`(カード内の見出し)は Noto Sans JP Bold 18px、行間 25px。本文の h2 は Figma に無いので、Montserrat 28px、行間 36px、上余白 48px、下余白 16px とする。h3 は Noto Sans JP Bold 18px、上余白 32px、下余白 8px
- ul、ol: 左のインデント 1.5em、項目の間隔 4px
- a: 文字色のまま、下線
- blockquote: 左に 2px の線(`#5d646e`)、左余白 16px、文字色 `#5d646e`
- code(インライン): 等幅、背景 `rgba(13,15,18,0.06)`、角丸 4px、余白 2px 4px
- pre: 背景 `#ffffff`、角丸 8px、余白 16px、横スクロール
- table: 幅 100%(672px まで)、罫線は下線のみ(`rgba(13,15,18,0.12)`)、th は Bold。375px では横スクロールできる包み(`overflow-x: auto`)が要るので、同期側に手を入れず CSS だけで扱えないか試し、無理なら `prose.css` で `table { display: block; overflow-x: auto; }` にする
- img(Figure カード外): `max-width: 100%`、角丸 8px
- hr: 1px、`rgba(13,15,18,0.12)`、上下 32px
- KaTeX: `.katex-display` の上下余白 16px

Figure カード(`.figure-card`)。Figma `4:34`

- 枠いっぱい(1088px まで、`.prose` の幅ではなく枠の幅)、白背景、角丸 24px、内側の余白 48px、上余白 64px
- 中は2カラム。左 `figure-card__media`(434px、画像は角丸 12px、`object-fit: cover`)、点線の区切り(`1px dashed rgba(13,15,18,0.2)`、左右 40px)、右 `figure-card__body`(残り。縦の中央揃え)
- 右上に Figure の透かし(`figure-card::before`、Montserrat 55px、`rgba(13,15,18,0.2)`、`content: "Figure"`)
- `figure-card__label`(Fig. 1): Noto Sans JP 12px、`#5d646e`。`figure-card__title`: Noto Sans JP Bold 18px。説明の p: 14px、行間 23px、`#5d646e`
- 768px 未満では1カラム(画像の下に本文)、余白 24px、角丸 16px

Note(`.note`)。Figma `4:56`

- `.prose` の幅(672px)、背景 `#eef0f3`、角丸 16px、内側の余白 32px、上余白 32px
- `note__label`: 赤い点(8px、`#ff3b1f`)と NOTE(Montserrat 12px、字間 1px、大文字、`#5d646e`)
- 本文: 14px、行間 23px

Figma の値はこれらを目安とし、`get_design_context` で取れた値があればそちらを正とする。取った値で指示書と違ったものは報告に書く。

## 受け入れ条件

- `content/en/prose-sample.json` を一時的に `published: true` にして `npm run build && npm run preview` で開き、1616px で Figma の Results フレームと Figure カード、Note、段落の間隔が一致する(スクリーンショットを報告に添える。確認後に `published: false` に戻す)
- 375px で表が横スクロールになり、Figure カードが1カラムになる
- 数式(インラインとブロック)が KaTeX のフォントで描画される。KaTeX の CSS とフォントが `dist/assets/` に出て、外部 URL を参照しない(`npm run check` が通る)
- `npm run check`、`npm test`、`npm run typecheck`、`npm run build` が通る
- `web/src/` に `window`、`document` の参照がない

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(prose の基本、Figure カード、Note、KaTeX、サンプルとテスト)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
