# 実装指示書: #28 Figma のレイアウトを実装する(サイドバー、本文の枠、フッター、フォント)

Issue: https://github.com/igemkeio/iGEM_wiki_keio/issues/28
設計メモ: docs/architecture.md(「デザイン」「ツールチェーン」の CSS の節、「状態の永続化」の言語の扱い)
原稿の形式: content/README.md(「片方の言語しかないページ」の規定)
Figma: iGEM Keio 2026 Wiki Pages(fileKey `ZK1xe32Ezu2DIbkPbDTfHd`)。Home フレーム `3:2`、Results フレーム `4:2`。Figma MCP が使えるなら `get_screenshot` と `get_design_context` で値を取る。使えなければ下の値を使う

## 目的

全ページ共通の枠(サイドバー、本文の枠、フッター)と、フォント、トークンを Figma のデザインどおりに作る。本文の中身のスタイル(見出し、段落、Figure カード、Note)は #29 で、Home のテンプレートは #30 で扱うので、ここでは触らない。

## 作業ブランチ

- `origin/feat/26-vite-prerender` から `feat/28-layout` を切る。PR は `feature/vite-mpa` に向ける。

## 変更範囲

触るファイル

- `web/src/styles/tokens.css`(新規)、`web/src/styles/global.css`(新規)
- `web/src/components/Sidebar.tsx` と `Sidebar.module.css`、`Footer.tsx` と `Footer.module.css`、`PageShell.tsx` と `PageShell.module.css`、`Toc.tsx` と `Toc.module.css`(すべて新規)
- `web/src/lib/toc.ts`(新規): `html` の h2、h3 の `id` とテキストから目次の木を作る純粋関数
- `web/src/Page.tsx`: `PageShell` を使う形に書き換える。`<head>` の `<link>` でフォントの CSS を読む
- `web/src/main.tsx`: `global.css` を import する(CSS を Vite に束ねさせるため)
- `web/public/fonts/`(新規): woff2 のフォント
- `web/vite.config.ts`: 環境変数 `WIKI_FONT_BASE`(既定 `/fonts`)を `define` で渡す
- `web/README.md`: フォントの置き場所と `WIKI_FONT_BASE` の説明を足す

触らないファイル

- `content/`、`web/src/content.ts`、`web/src/routes.ts`、`web/src/base.ts`、`web/scripts/`、`web/public/` の既存ディレクトリ、`vercel.json`、CI

## デザインの値(Figma から)

トークンは `tokens.css` の `:root` にカスタムプロパティで置く。名前は `--color-*`、`--font-*`、`--size-*`、`--space-*` の形。

- 色: 文字 `#0d0f12`(`--color-ink`)、補助の文字 `#5d646e`、ナビの非選択 `rgba(13,15,18,0.7)`、ページ背景は Figma の淡いグレー(スクリーンショットから取る。おおよそ `#dfe3ea` 前後)、カードとカード面の白 `#ffffff`
- フォント: 見出しとナビが Montserrat、本文が Noto Sans JP。英語本文も Noto Sans JP で統一する(ラテン文字も含まれる)
- h1: Montserrat 92.8px、行間 90.944px、字間 0.928px、大文字(`text-transform: uppercase`)。データは原文のまま
- 小見出し(subtitle): Noto Sans JP 12px、行間 16px、字間 0.3px、色 `#5d646e`
- 本文: Noto Sans JP 16px、行間 31.2px、幅 672px(`--size-prose`)
- ナビ: Montserrat 15.2px、行間 14.896px、字間 0.152px、大文字、項目の間隔 2px。現在のページは `#0d0f12`、それ以外は `rgba(13,15,18,0.7)`
- 枠: 本文の枠は幅 1200px を中央に置く(Figma では x=300 から 1500)。枠の内側の左右の余白は 56px。サイドバーは左端から 56px の位置にロゴ、その下に縦線(幅 1px、`#0d0f12` の薄い色、高さは画面の約 1079px 分)、ナビは画面の下寄り(Figma では y=847)に置く。サイドバーは `position: fixed` で、スクロールしても動かない
- ロゴ: `iGEM` と `Keio 2026` の2語。Figma のフレーム `3:182`
- フッター: `iGEM Keio 2026 · Licensed under CC BY 4.0`。小さい文字、`#5d646e`、本文の枠の左に揃える

## サイドバーとナビ

- ナビの項目は `routes.ts` のページ一覧から、現在の locale のものだけを `order` の順で出す。`home` も含む(Figma では HOME が先頭)
- 現在のページは濃い色にし、`aria-current="page"` を付ける
- 言語切り替えリンクをナビの下に置く(EN / JA)。相手の言語に同じ slug があればそのページへ、なければ相手の言語の home へ向ける(content/README.md の規定)。リンクには `hreflang` を付ける。`localStorage` への保存は #32 の範囲なので、ここではリンクだけ
- すべての `href` は `withBase` を通す
- 375px(およそ 768px 未満)では、サイドバーを上部の細いバー(高さ 56px、ロゴと開くボタン)にし、押すとナビが上から降りてくる。開閉は `<details>` と `<summary>` で実装し、JS を書かない。開くボタンには `aria-label` を付ける
- 実装後、375px の見え方を Figma に書き戻す(Figma MCP の `generate_figma_design`)。MCP が使えなければ、スクリーンショットを撮って報告に添え、書き戻しは未実施と書く

## 目次(Toc)

- `lib/toc.ts` が `html` から h2 と h3 の `id` とテキストを拾い、h2 の下に h3 を入れた木を返す。`<aside class="note">` の中の見出しは除く(callout の中の見出しにも id は付いているが、目次には載せない)
- 見出しが1つも無いページ(home など)では Toc を出さない
- 置き場所は、本文の枠の右側に `position: sticky` で置く(Figma のデザインには無いので、これがこちらの判断)。1280px 未満では出さない
- 見出しのテキストは HTML タグを除いたもの。KaTeX の HTML が入っていたら `<span class="katex-mathml">` を除いてから取る

## フォント

- Google Fonts から Montserrat(Variable、weight 400〜700)と Noto Sans JP(Variable)を取得し、woff2 で `web/public/fonts/` に置く
- Noto Sans JP は全部で数MBあるので、サブセット化する。`content/**/*.json` に出てくる文字と、JIS 第1水準、ひらがな、カタカナ、記号、ラテン文字を含める。道具は `pyftsubset`(fonttools)か `subset-font`(npm)のどちらかで、リポジトリには成果物の woff2 だけを入れ、サブセット化のコマンドを `web/README.md` に書く。目安は 1MB 以下
- `@font-face` を `global.css` に書く。`src: url(...)` の先頭は `WIKI_FONT_BASE`(既定 `/fonts`、本番では `https://static.igem.wiki/teams/<id>/fonts` に差し替える)。`font-display: swap`
- `static.igem.wiki` へのアップロードは人が行うので、この Issue では `public/fonts/` に置いて動くところまで

## CSS の書き方

- `global.css`: `@layer reset, tokens, prose, components;` を先頭で宣言し、リセット(box-sizing、margin 0、img の max-width)、`@font-face`、`body` の背景と文字色、`@view-transition { navigation: auto; }`
- 部品ごとの見た目は `.module.css`。クラス名は `styles.root`、`styles.nav` のように短く
- `prose` レイヤーは空のまま置く(#29 で埋める)
- Tailwind などは入れない

## 受け入れ条件

- `npm run build` で全ページに Sidebar、Footer が出る。Results 相当のページ(`content/en/results.json` があればそれ、なければ `home.json` を複製して一時的に作り、確認後に消す)を 1280px で開き、Figma の Results フレームと枠の位置、余白、フォント、色が一致する(スクリーンショットを撮って報告に添える)
- 375px でサイドバーが上部のバーになり、開閉できる
- ナビが `order` の順で並び、現在のページが濃い色で `aria-current` を持つ
- 言語切り替えで `/` ↔ `/ja/` に移れる。相手の言語に無い slug では home に向く
- `dist/` の HTML に React の `<script>` が含まれない(`islands` が空のため)。`<details>` の開閉に JS を使っていない
- `npm run typecheck` がエラー0
- `web/src/` のビルド時コードに `window`、`document` の参照がない
- フォントの woff2 が `dist/fonts/` に出て、合計 1.5MB 以下

## 規約

- コミットは `<prefix>: 日本語一行。`。1コミット1論理単位(tokens と global、Sidebar、Footer と PageShell、Toc、フォント、Page.tsx の差し替え、README、の順が目安)
- コメントと README は日本語。太字とカギ括弧を使わず、英単語や数字の両端に半角スペースを入れない。コメントはいまどうなっているかだけを書く
- Claude の痕跡を付けない
- PR は作らず、push して本文の案を報告する
